using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Cloudinary;
using GaStore.Data.Models;
using GaStore.Shared.Uploads;

namespace GaStore.UploadService.Services
{
    public class FileUploadService : IFileUploadService
    {
        private static readonly HashSet<string> AllowedExtensions =
        [
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg",
            ".mp4", ".webm", ".mov", ".avi", ".m4v",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".zip"
        ];

        private const long MaxFileSizeBytes = 25 * 1024 * 1024;

        private readonly AppSettings _appSettings;
        private readonly ICloudinaryService? _cloudinaryService;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(
            IOptions<AppSettings> appSettings,
            ILogger<FileUploadService> logger,
            ICloudinaryService? cloudinaryService = null)
        {
            _appSettings = appSettings.Value;
            _logger = logger;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<FileUploadResponse> UploadAsync(IFormFile file, string? uploadPath = null, string? category = null)
        {
            var response = new FileUploadResponse();

            if (file == null || file.Length == 0)
            {
                response.ErrorMessage = "File is empty.";
                return response;
            }

            if (file.Length > MaxFileSizeBytes)
            {
                response.ErrorMessage = "File size exceeds the 25MB limit.";
                return response;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                response.ErrorMessage = "File type is not supported.";
                return response;
            }

            try
            {
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    return await UploadToCloudinaryAsync(file, extension);
                }

                return await SaveLocallyAsync(file, extension, uploadPath, category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName}", file.FileName);
                response.ErrorMessage = "Error uploading file.";
                return response;
            }
        }

        public async Task<DeleteFileResponse> DeleteAsync(string fileUrl)
        {
            var response = new DeleteFileResponse { FileUrl = fileUrl };

            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                response.ErrorMessage = "File URL is required.";
                return response;
            }

            try
            {
                if (_appSettings.UseCloudinary && _cloudinaryService != null && IsCloudinaryUrl(fileUrl))
                {
                    var extension = Path.GetExtension(fileUrl).ToLowerInvariant();
                    var resourceType = IsImageExtension(extension) ? "image" : "raw";
                    var publicId = ExtractCloudinaryPublicId(fileUrl);
                    response.IsSuccess = !string.IsNullOrWhiteSpace(publicId) &&
                                         await _cloudinaryService.DeleteFileAsync(publicId, resourceType);
                    response.ErrorMessage = response.IsSuccess ? null : "Unable to delete file from Cloudinary.";
                    return response;
                }

                var localPath = ConvertUrlToLocalPath(fileUrl);
                if (string.IsNullOrWhiteSpace(localPath) || !File.Exists(localPath))
                {
                    response.ErrorMessage = "File not found.";
                    return response;
                }

                File.Delete(localPath);
                response.IsSuccess = true;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileUrl}", fileUrl);
                response.ErrorMessage = "Error deleting file.";
                return response;
            }
        }

        private async Task<FileUploadResponse> UploadToCloudinaryAsync(IFormFile file, string extension)
        {
            var uploadResult = IsImageExtension(extension)
                ? await _cloudinaryService!.UploadImageAsync(file)
                : await _cloudinaryService!.UploadFileAsync(file);

            return new FileUploadResponse
            {
                IsSuccess = uploadResult.IsSuccess,
                FileName = GetStoredFileName(uploadResult, extension),
                FileUrl = uploadResult.Url,
                PublicId = uploadResult.PublicId,
                ContentType = file.ContentType,
                Extension = extension,
                Provider = "cloudinary",
                IsImage = IsImageExtension(extension),
                OriginalSize = file.Length,
                StoredSize = uploadResult.Bytes,
                Width = uploadResult.Width == 0 ? null : uploadResult.Width,
                Height = uploadResult.Height == 0 ? null : uploadResult.Height,
                ErrorMessage = uploadResult.ErrorMessage
            };
        }

        private async Task<FileUploadResponse> SaveLocallyAsync(IFormFile file, string extension, string? uploadPath, string? category)
        {
            var baseUploadPath = string.IsNullOrWhiteSpace(uploadPath)
                ? Path.Combine("wwwroot", "uploads", string.IsNullOrWhiteSpace(category) ? "files" : category, DateTime.UtcNow.ToString("yyyy-MM"))
                : uploadPath;

            Directory.CreateDirectory(baseUploadPath);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(baseUploadPath, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = filePath.Replace("wwwroot", string.Empty).Replace("\\", "/");

            return new FileUploadResponse
            {
                IsSuccess = true,
                FileName = fileName,
                FilePath = filePath,
                FileUrl = $"{_appSettings.ApiRoot?.TrimEnd('/')}{relativePath}",
                ContentType = file.ContentType,
                Extension = extension,
                Provider = "local",
                IsImage = IsImageExtension(extension),
                OriginalSize = file.Length,
                StoredSize = new FileInfo(filePath).Length
            };
        }

        private static bool IsImageExtension(string extension)
        {
            return extension is ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" or ".bmp" or ".svg";
        }

        private static bool IsCloudinaryUrl(string fileUrl)
        {
            return fileUrl.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase);
        }

        private static string? ExtractCloudinaryPublicId(string fileUrl)
        {
            if (!Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            {
                return null;
            }

            var path = uri.AbsolutePath;
            var uploadIndex = path.IndexOf("/upload/", StringComparison.OrdinalIgnoreCase);
            if (uploadIndex < 0)
            {
                return null;
            }

            var publicIdPath = path[(uploadIndex + "/upload/".Length)..];
            var versionSegmentIndex = publicIdPath.IndexOf('/');
            if (versionSegmentIndex >= 0 && publicIdPath[..versionSegmentIndex].StartsWith('v'))
            {
                publicIdPath = publicIdPath[(versionSegmentIndex + 1)..];
            }

            return Path.ChangeExtension(publicIdPath, null)?.Replace("\\", "/");
        }

        private static string? ConvertUrlToLocalPath(string fileUrl)
        {
            if (!Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            {
                return null;
            }

            var localPath = uri.LocalPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", localPath.Replace($"wwwroot{Path.DirectorySeparatorChar}", string.Empty));
        }

        private static string GetStoredFileName(CloudinaryUploadResult uploadResult, string extension)
        {
            if (!string.IsNullOrWhiteSpace(uploadResult.Url) &&
                Uri.TryCreate(uploadResult.Url, UriKind.Absolute, out var fileUri))
            {
                var fileName = Path.GetFileName(fileUri.LocalPath);
                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    return fileName;
                }
            }

            if (!string.IsNullOrWhiteSpace(uploadResult.PublicId))
            {
                var publicIdName = Path.GetFileName(uploadResult.PublicId.Replace('/', Path.DirectorySeparatorChar));
                if (!string.IsNullOrWhiteSpace(publicIdName))
                {
                    return publicIdName.EndsWith(extension, StringComparison.OrdinalIgnoreCase)
                        ? publicIdName
                        : $"{publicIdName}{extension}";
                }
            }

            return $"{Guid.NewGuid():N}{extension}";
        }
    }
}
