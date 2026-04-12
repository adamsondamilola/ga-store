using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GaStore.Core.Services.Cloudinary
{

    public class CloudinaryService : ICloudinaryService
    {
        private readonly CloudinaryDotNet.Cloudinary? _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;
        private readonly bool _isConfigured;

        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
        {
            _logger = logger;

            var cloudName = configuration["Cloudinary:CloudName"];
            var apiKey = configuration["Cloudinary:ApiKey"];
            var apiSecret = configuration["Cloudinary:ApiSecret"];

            _isConfigured =
                !string.IsNullOrWhiteSpace(cloudName) &&
                !string.IsNullOrWhiteSpace(apiKey) &&
                !string.IsNullOrWhiteSpace(apiSecret);

            if (!_isConfigured)
            {
                _logger.LogInformation("Cloudinary is disabled or not configured. Uploads will use non-Cloudinary storage.");
                return;
            }

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new CloudinaryDotNet.Cloudinary(account);
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(IFormFile file)
        {
            var result = new CloudinaryUploadResult();

            try
            {
                if (!EnsureConfigured(result))
                {
                    return result;
                }

                // Validate file
                if (file == null || file.Length == 0)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File is empty";
                    return result;
                }

                // Validate image file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Invalid file type. Only images are allowed.";
                    return result;
                }

                // Validate file size (max 20MB for Cloudinary)
                if (file.Length > 20 * 1024 * 1024)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File size too large. Maximum size is 20MB.";
                    return result;
                }

                // Copy file to memory stream to ensure it can be read multiple times
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                var storedFileName = GenerateStoredFileName(file.FileName);

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(storedFileName, memoryStream),
                    Transformation = new Transformation()
                        .Quality("auto:good") // Better quality auto setting
                        .FetchFormat("auto"), // Auto choose best format
                    Folder = "uploads/images",
                    UseFilename = false,
                    UniqueFilename = false,
                    Overwrite = false
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = uploadResult.Error.Message;
                    return result;
                }

                result.IsSuccess = true;
                result.PublicId = uploadResult.PublicId;
                result.Url = uploadResult.Url.ToString();
                result.SecureUrl = uploadResult.SecureUrl.ToString();
                result.Format = uploadResult.Format;
                result.Bytes = uploadResult.Bytes;
                result.Width = uploadResult.Width;
                result.Height = uploadResult.Height;

                _logger.LogInformation("Image uploaded successfully: {PublicId}", result.PublicId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image to Cloudinary");
                result.IsSuccess = false;
                result.ErrorMessage = "Error uploading image. Please try again.";
            }

            return result;
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(byte[] fileBytes, string fileName)
        {
            var result = new CloudinaryUploadResult();

            try
            {
                if (!EnsureConfigured(result))
                {
                    return result;
                }

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File is empty";
                    return result;
                }

                // Validate file size (max 20MB for Cloudinary)
                if (fileBytes.Length > 20 * 1024 * 1024)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File size too large. Maximum size is 20MB.";
                    return result;
                }

                using var memoryStream = new MemoryStream(fileBytes);

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(fileName, memoryStream),
                    Transformation = new Transformation()
                        .Quality("auto:good")
                        .FetchFormat("auto"),
                    Folder = "uploads/images",
                    UseFilename = false,
                    UniqueFilename = true,
                    Overwrite = false
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = uploadResult.Error.Message;
                    return result;
                }

                result.IsSuccess = true;
                result.PublicId = uploadResult.PublicId;
                result.Url = uploadResult.Url.ToString();
                result.SecureUrl = uploadResult.SecureUrl.ToString();
                result.Format = uploadResult.Format;
                result.Bytes = uploadResult.Bytes;
                result.Width = uploadResult.Width;
                result.Height = uploadResult.Height;

                _logger.LogInformation("Image uploaded successfully: {PublicId}", result.PublicId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image bytes to Cloudinary");
                result.IsSuccess = false;
                result.ErrorMessage = "Error uploading image. Please try again.";
            }

            return result;
        }

        public async Task<CloudinaryUploadResult> UploadFileAsync(IFormFile file)
        {
            var result = new CloudinaryUploadResult();

            try
            {
                if (!EnsureConfigured(result))
                {
                    return result;
                }

                if (file == null || file.Length == 0)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File is empty";
                    return result;
                }

                // Validate file size (max 100MB for Cloudinary raw uploads)
                if (file.Length > 100 * 1024 * 1024)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File size too large. Maximum size is 100MB.";
                    return result;
                }

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                var storedFileName = GenerateStoredFileName(file.FileName);

                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(storedFileName, memoryStream),
                    Folder = "uploads/files",
                    UseFilename = false,
                    UniqueFilename = false,
                    Overwrite = false
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = uploadResult.Error.Message;
                    return result;
                }

                result.IsSuccess = true;
                result.PublicId = uploadResult.PublicId;
                result.Url = uploadResult.Url.ToString();
                result.SecureUrl = uploadResult.SecureUrl.ToString();
                result.Format = uploadResult.Format;
                result.Bytes = uploadResult.Bytes;

                _logger.LogInformation("File uploaded successfully: {PublicId}", result.PublicId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to Cloudinary");
                result.IsSuccess = false;
                result.ErrorMessage = "Error uploading file. Please try again.";
            }

            return result;
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(Stream fileStream, string fileName)
        {
            var result = new CloudinaryUploadResult();

            try
            {
                if (!EnsureConfigured(result))
                {
                    return result;
                }

                if (fileStream == null || fileStream.Length == 0)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "File stream is empty";
                    return result;
                }

                // Reset position if possible
                if (fileStream.CanSeek)
                {
                    fileStream.Position = 0;
                }

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(fileName, fileStream),
                    Transformation = new Transformation()
                        .Quality("auto:good")
                        .FetchFormat("auto"),
                    Folder = "uploads/images",
                    UseFilename = false,
                    UniqueFilename = true,
                    Overwrite = false
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = uploadResult.Error.Message;
                    return result;
                }

                result.IsSuccess = true;
                result.PublicId = uploadResult.PublicId;
                result.Url = uploadResult.Url.ToString();
                result.SecureUrl = uploadResult.SecureUrl.ToString();
                result.Format = uploadResult.Format;
                result.Bytes = uploadResult.Bytes;
                result.Width = uploadResult.Width;
                result.Height = uploadResult.Height;

                _logger.LogInformation("Image uploaded successfully from stream: {PublicId}", result.PublicId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image stream to Cloudinary");
                result.IsSuccess = false;
                result.ErrorMessage = "Error uploading image. Please try again.";
            }

            return result;
        }
        public async Task<bool> DeleteFileAsync(string publicId, string resourceType = "image")
        {
            try
            {
                if (!_isConfigured || _cloudinary == null)
                {
                    _logger.LogInformation("Cloudinary delete skipped because Cloudinary is disabled or not configured.");
                    return false;
                }

                if (string.IsNullOrEmpty(publicId))
                    return false;

                var deleteParams = new DeletionParams(publicId)
                {
                    ResourceType = resourceType.Equals("raw", StringComparison.OrdinalIgnoreCase)
                        ? ResourceType.Raw
                        : ResourceType.Image
                };

                var result = await _cloudinary.DestroyAsync(deleteParams);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file from Cloudinary: {PublicId}", publicId);
                return false;
            }
        }

        private bool EnsureConfigured(CloudinaryUploadResult result)
        {
            if (_isConfigured && _cloudinary != null)
            {
                return true;
            }

            result.IsSuccess = false;
            result.ErrorMessage = "Cloudinary is disabled.";
            return false;
        }

        private static string GenerateStoredFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            return $"{Guid.NewGuid():N}{extension}";
        }
    }
}
