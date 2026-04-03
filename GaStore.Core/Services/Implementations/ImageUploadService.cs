using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Processing.Processors.Transforms;
using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Enums;
using GaStore.Data.Models;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class ImageUploadService : IImageUploadService
    {
        private readonly ILogger<ImageUploadService> _logger;
        private readonly ImageOptimizationSettings _imageSettings;
        private readonly AppSettings _appSettings;
        private readonly ICloudinaryService _cloudinaryService;

        // Default allowed file extensions
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".svg" };

        // Image format MIME types
        private static readonly Dictionary<string, string> MimeTypes = new()
        {
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".gif", "image/gif" },
            { ".webp", "image/webp" },
            { ".bmp", "image/bmp" },
            { ".tiff", "image/tiff" },
            { ".svg", "image/svg+xml" }
        };

        public ImageUploadService(
            ILogger<ImageUploadService> logger,
            IOptions<ImageOptimizationSettings> imageSettings,
            IOptions<AppSettings> appSettings,
            ICloudinaryService cloudinaryService = null)
        {
            _logger = logger;
            _imageSettings = imageSettings?.Value ?? new ImageOptimizationSettings();
            _appSettings = appSettings?.Value ?? new AppSettings();
            _cloudinaryService = cloudinaryService;
        }

        public async Task<ImageUploadResult> UploadAndOptimizeImageAsync(IFormFile imageFile, string uploadPath = null)
        {
            var result = new ImageUploadResult();

            try
            {
                // Validate the image file
                var validationResult = await ValidateImageFileAsync(imageFile);
                if (!validationResult)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Invalid image file";
                    return result;
                }

                // Optimize the image
                var optimizedImage = await OptimizeImageAsync(imageFile);

                // Save based on configuration
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    return await UploadToCloudinaryAsync(optimizedImage, imageFile);
                }
                else
                {
                    return await SaveToLocalStorageAsync(optimizedImage, imageFile, uploadPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading and optimizing image: {FileName}", imageFile?.FileName);
                result.IsSuccess = false;
                result.ErrorMessage = $"Error processing image: {ex.Message}";
                return result;
            }
        }

        public async Task<List<ImageUploadResult>> UploadAndOptimizeImagesAsync(IEnumerable<IFormFile> imageFiles, string uploadPath = null)
        {
            var results = new List<ImageUploadResult>();
            var tasks = new List<Task<ImageUploadResult>>();

            foreach (var imageFile in imageFiles)
            {
                tasks.Add(UploadAndOptimizeImageAsync(imageFile, uploadPath));
            }

            var uploadResults = await Task.WhenAll(tasks);
            results.AddRange(uploadResults);

            return results;
        }

        public async Task<ImageUploadResult> OptimizeAndSaveImageAsync(IFormFile imageFile, string savePath)
        {
            var result = new ImageUploadResult();

            try
            {
                // Validate the image file
                if (!await ValidateImageFileAsync(imageFile))
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Invalid image file";
                    return result;
                }

                // Optimize the image
                var optimizedImage = await OptimizeImageAsync(imageFile);

                // Ensure directory exists
                var directory = Path.GetDirectoryName(savePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Save the optimized image
                await using var fileStream = new FileStream(savePath, FileMode.Create);
                await optimizedImage.CopyToAsync(fileStream);

                // Get image info
                await using var infoStream = imageFile.OpenReadStream();
                using var image = await Image.LoadAsync(infoStream);

                result.IsSuccess = true;
                result.FileName = Path.GetFileName(savePath);
                result.FilePath = savePath;
                result.Width = image.Width;
                result.Height = image.Height;
                result.Format = image.Metadata.DecodedImageFormat?.Name ?? "unknown";
                result.OriginalSize = imageFile.Length;
                result.OptimizedSize = new FileInfo(savePath).Length;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing and saving image: {FileName}", imageFile?.FileName);
                result.IsSuccess = false;
                result.ErrorMessage = $"Error saving image: {ex.Message}";
            }

            return result;
        }

        public async Task<byte[]> OptimizeImageToBytesAsync(IFormFile imageFile)
        {
            try
            {
                var optimizedImage = await OptimizeImageAsync(imageFile);
                await using var memoryStream = new MemoryStream();
                await optimizedImage.CopyToAsync(memoryStream);
                return memoryStream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing image to bytes: {FileName}", imageFile?.FileName);
                throw;
            }
        }

        public async Task<Stream> OptimizeImageToStreamAsync(IFormFile imageFile)
        {
            try
            {
                var optimizedImage = await OptimizeImageAsync(imageFile);
                var memoryStream = new MemoryStream();
                await optimizedImage.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                return memoryStream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing image to stream: {FileName}", imageFile?.FileName);
                throw;
            }
        }

        public async Task<bool> ValidateImageFileAsync(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                return false;

            // Check file size
            if (imageFile.Length > _imageSettings.MaxOriginalFileSize)
            {
                _logger.LogWarning("File size exceeds limit: {FileName}, Size: {Size}",
                    imageFile.FileName, imageFile.Length);
                return false;
            }

            // Check file extension
            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Invalid file extension: {FileName}", imageFile.FileName);
                return false;
            }

            // Check MIME type
            if (!string.IsNullOrEmpty(imageFile.ContentType) &&
                !imageFile.ContentType.StartsWith("image/"))
            {
                _logger.LogWarning("Invalid MIME type: {FileName}, ContentType: {ContentType}",
                    imageFile.FileName, imageFile.ContentType);
                return false;
            }

            // Validate image signature
            try
            {
                await using var stream = imageFile.OpenReadStream();
                var buffer = new byte[12];
                await stream.ReadAsync(buffer.AsMemory(0, buffer.Length));
                stream.Position = 0;

                return IsValidImageSignature(buffer);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to validate image signature: {FileName}", imageFile.FileName);
                return false;
            }
        }

        private bool IsValidImageSignature(byte[] buffer)
        {
            // JPEG
            if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
                return true;

            // PNG
            if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47)
                return true;

            // GIF
            if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46)
                return true;

            // BMP
            if (buffer[0] == 0x42 && buffer[1] == 0x4D)
                return true;

            // WebP
            if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
                buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
                return true;

            // TIFF
            if ((buffer[0] == 0x49 && buffer[1] == 0x49 && buffer[2] == 0x2A && buffer[3] == 0x00) ||
                (buffer[0] == 0x4D && buffer[1] == 0x4D && buffer[2] == 0x00 && buffer[3] == 0x2A))
                return true;

            return false;
        }

        public async Task DeleteImageAsync(string imageUrl)
        {
            try
            {
                if (_appSettings.UseCloudinary && _cloudinaryService != null)
                {
                    // Extract public ID from Cloudinary URL
                    var publicId = ExtractCloudinaryPublicId(imageUrl);
                    if (!string.IsNullOrEmpty(publicId))
                    {
                        await _cloudinaryService.DeleteFileAsync(publicId);
                    }
                }
                else
                {
                    // Delete from local storage
                    var localPath = ConvertUrlToLocalPath(imageUrl);
                    if (File.Exists(localPath))
                    {
                        File.Delete(localPath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
                throw;
            }
        }

        public string GenerateOptimizedFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            var baseName = Path.GetFileNameWithoutExtension(originalFileName);
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var guid = Guid.NewGuid().ToString("N").Substring(0, 8);

            // Determine output extension based on settings
            var outputExtension = DetermineOutputExtension(extension);

            return $"{baseName}_{timestamp}_{guid}{outputExtension}";
        }

        public async Task<Data.Dtos.ImageUploads.ImageInfo> GetImageInfo(IFormFile imageFile)
        {
            try
            {
                await using var stream = imageFile.OpenReadStream();
                using var image = await Image.LoadAsync(stream);

                return new Data.Dtos.ImageUploads.ImageInfo
                {
                    Width = image.Width,
                    Height = image.Height,
                    Format = image.Metadata.DecodedImageFormat?.Name ?? "unknown",
                    MimeType = GetMimeType(Path.GetExtension(imageFile.FileName)),
                    FileSize = imageFile.Length,
                    HasTransparency = HasTransparency(image),
                    IsAnimated = IsAnimated(image)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting image info: {FileName}", imageFile.FileName);
                throw;
            }
        }

        #region Private Methods

        private async Task<IFormFile> OptimizeImageAsync(IFormFile imageFile)
        {
            // Skip optimization if disabled
            if (!_imageSettings.EnableOptimization)
                return imageFile;

            try
            {
                await using var inputStream = imageFile.OpenReadStream();
                using var image = await Image.LoadAsync(inputStream);

                // Get image info
                var info = await GetImageInfo(imageFile);

                // Determine output format
                var outputFormat = DetermineOutputFormat(info, Path.GetExtension(imageFile.FileName));

                // Resize if needed
                if (ShouldResizeImage(image, info))
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = CalculateTargetSize(image),
                        Mode = ResizeMode.Max,
                        Compand = true,
                        Sampler = KnownResamplers.Lanczos3
                    }));
                }

                // Create output memory stream
                var outputStream = new MemoryStream();

                // Encode with optimization settings
                await EncodeImageWithOptimizationAsync(image, outputStream, outputFormat);

                outputStream.Position = 0;

                // Create optimized IFormFile
                var optimizedBytes = outputStream.ToArray();
                var optimizedFileName = GenerateOptimizedFileName(imageFile.FileName);
                var contentType = GetContentTypeForFormat(outputFormat);

                return new OptimizedFormFile(optimizedBytes, optimizedFileName, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to optimize image {FileName}, using original", imageFile.FileName);
                return imageFile; // Fallback to original
            }
        }

        private async Task<Data.Dtos.ImageUploads.ImageInfo> GetImageInfo(Image image)
        {
            return new Data.Dtos.ImageUploads.ImageInfo
            {
                Width = image.Width,
                Height = image.Height,
                Format = image.Metadata.DecodedImageFormat?.Name ?? "unknown",
                HasTransparency = HasTransparency(image),
                IsAnimated = IsAnimated(image)
            };
        }

        private bool HasTransparency(Image image)
        {
            try
            {
                // Check if image has alpha channel
                return image.PixelType?.AlphaRepresentation != null;
            }
            catch
            {
                return false;
            }
        }

        private bool IsAnimated(Image image)
        {
            try
            {
                return image.Frames.Count > 1;
            }
            catch
            {
                return false;
            }
        }

        private ImageFormat DetermineOutputFormat(Data.Dtos.ImageUploads.ImageInfo info, string originalExtension)
        {
            // Use preferred format from settings
            if (_imageSettings.PreferredFormat != ImageFormat.Auto)
                return _imageSettings.PreferredFormat;

            // Preserve GIF animations
            if (originalExtension.Equals(".gif", StringComparison.OrdinalIgnoreCase) && info.IsAnimated)
                return ImageFormat.Gif;

            // Preserve PNG transparency
            if (originalExtension.Equals(".png", StringComparison.OrdinalIgnoreCase) && info.HasTransparency)
                return ImageFormat.Png;

            // Default to WebP for best compression (if browser supports it)
            return ImageFormat.WebP;
        }

        private string DetermineOutputExtension(string originalExtension)
        {
            if (_imageSettings.PreferredFormat == ImageFormat.Auto)
                return originalExtension;

            return _imageSettings.PreferredFormat switch
            {
                ImageFormat.Jpeg => ".jpg",
                ImageFormat.Png => ".png",
                ImageFormat.WebP => ".webp",
                ImageFormat.Gif => ".gif",
                _ => ".jpg"
            };
        }

        private bool ShouldResizeImage(Image image, Data.Dtos.ImageUploads.ImageInfo info)
        {
            return info.Width > _imageSettings.MaxWidth ||
                   info.Height > _imageSettings.MaxHeight ||
                   _imageSettings.ForceResizeToMaxDimensions;
        }

        private Size CalculateTargetSize(Image image)
        {
            var maxWidth = _imageSettings.MaxWidth;
            var maxHeight = _imageSettings.MaxHeight;

            // Calculate while maintaining aspect ratio
            var ratioX = (double)maxWidth / image.Width;
            var ratioY = (double)maxHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            var newWidth = (int)(image.Width * ratio);
            var newHeight = (int)(image.Height * ratio);

            // Ensure minimum dimensions
            newWidth = Math.Max(newWidth, _imageSettings.MinWidth);
            newHeight = Math.Max(newHeight, _imageSettings.MinHeight);

            return new Size(newWidth, newHeight);
        }

        private async Task EncodeImageWithOptimizationAsync(Image image, Stream outputStream, ImageFormat format)
        {
            IImageEncoder encoder = format switch
            {
                ImageFormat.Jpeg => new JpegEncoder
                {
                    Quality = _imageSettings.JpegQuality,
                    SkipMetadata = _imageSettings.StripMetadata,
                   // ColorType = JpegColorType.YCbCrRatio444
                },
                ImageFormat.Png => new PngEncoder
                {
                    CompressionLevel = _imageSettings.PngCompressionLevel,
                    SkipMetadata = _imageSettings.StripMetadata,
                    ColorType = PngColorType.RgbWithAlpha
                },
                ImageFormat.WebP => new WebpEncoder
                {
                    Quality = _imageSettings.WebpQuality,
                    Method = WebpEncodingMethod.Default,
                    SkipMetadata = _imageSettings.StripMetadata
                },
                ImageFormat.Gif => new GifEncoder
                {
                    SkipMetadata = _imageSettings.StripMetadata
                },
                _ => new JpegEncoder { Quality = 85 }
            };

            await image.SaveAsync(outputStream, encoder);
        }

        private async Task<ImageUploadResult> UploadToCloudinaryAsync(IFormFile optimizedImage, IFormFile originalImage)
        {
            var result = new ImageUploadResult();

            if (_cloudinaryService == null)
            {
                result.IsSuccess = false;
                result.ErrorMessage = "Cloudinary service not available";
                return result;
            }

            var uploadResult = await _cloudinaryService.UploadImageAsync(optimizedImage);

            if (uploadResult.IsSuccess)
            {
                result.IsSuccess = true;
                result.ImageUrl = uploadResult.Url;
                result.PublicId = uploadResult.PublicId;
                result.FileName = optimizedImage.FileName;
                result.OriginalSize = originalImage.Length;
                result.OptimizedSize = await GetFileSizeAsync(optimizedImage);

                // Get image dimensions
                await using var stream = optimizedImage.OpenReadStream();
                using var image = await Image.LoadAsync(stream);
                result.Width = image.Width;
                result.Height = image.Height;
                result.Format = image.Metadata.DecodedImageFormat?.Name ?? "unknown";
            }
            else
            {
                result.IsSuccess = false;
                result.ErrorMessage = uploadResult.ErrorMessage;
            }

            return result;
        }

        private async Task<ImageUploadResult> SaveToLocalStorageAsync(IFormFile optimizedImage, IFormFile originalImage, string uploadPath)
        {
            var result = new ImageUploadResult();

            try
            {
                // Determine upload directory
                var baseUploadPath = string.IsNullOrEmpty(uploadPath)
                    ? Path.Combine("wwwroot", "uploads", "images", DateTime.UtcNow.ToString("yyyy-MM"))
                    : uploadPath;

                // Ensure directory exists
                Directory.CreateDirectory(baseUploadPath);

                // Generate file name
                var fileName = GenerateOptimizedFileName(optimizedImage.FileName);
                var filePath = Path.Combine(baseUploadPath, fileName);

                // Save file
                await using var fileStream = new FileStream(filePath, FileMode.Create);
                await optimizedImage.CopyToAsync(fileStream);

                // Get image info
                await using var infoStream = optimizedImage.OpenReadStream();
                using var image = await Image.LoadAsync(infoStream);

                // Build URL
                var relativePath = filePath.Replace("wwwroot", "").Replace("\\", "/");
                var imageUrl = $"{_appSettings.ApiRoot?.TrimEnd('/')}{relativePath}";

                result.IsSuccess = true;
                result.ImageUrl = imageUrl;
                result.FileName = fileName;
                result.FilePath = filePath;
                result.Width = image.Width;
                result.Height = image.Height;
                result.Format = image.Metadata.DecodedImageFormat?.Name ?? "unknown";
                result.OriginalSize = originalImage.Length;
                result.OptimizedSize = new FileInfo(filePath).Length;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to local storage");
                result.IsSuccess = false;
                result.ErrorMessage = $"Error saving image: {ex.Message}";
            }

            return result;
        }

        private async Task<long> GetFileSizeAsync(IFormFile file)
        {
            await using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            return memoryStream.Length;
        }

        private string ExtractCloudinaryPublicId(string imageUrl)
        {
            try
            {
                var uri = new Uri(imageUrl);
                var segments = uri.Segments;
                var lastSegment = segments.LastOrDefault();
                return lastSegment?.Split('.')[0];
            }
            catch
            {
                return null;
            }
        }

        private string ConvertUrlToLocalPath(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return null;

            var uri = new Uri(imageUrl);
            var localPath = uri.LocalPath;

            // Remove API root if present
            if (!string.IsNullOrEmpty(_appSettings.ApiRoot) &&
                localPath.StartsWith(_appSettings.ApiRoot))
            {
                localPath = localPath.Substring(_appSettings.ApiRoot.Length);
            }

            return Path.Combine("wwwroot", localPath.TrimStart('/'));
        }

        private string GetContentTypeForFormat(ImageFormat format)
        {
            return format switch
            {
                ImageFormat.Jpeg => "image/jpeg",
                ImageFormat.Png => "image/png",
                ImageFormat.WebP => "image/webp",
                ImageFormat.Gif => "image/gif",
                _ => "image/jpeg"
            };
        }

        private string GetMimeType(string extension)
        {
            return MimeTypes.TryGetValue(extension.ToLowerInvariant(), out var mimeType)
                ? mimeType
                : "application/octet-stream";
        }

        #endregion

        #region Helper Classes

        private class OptimizedFormFile : IFormFile
        {
            private readonly byte[] _fileData;
            private readonly string _fileName;
            private readonly string _contentType;

            public OptimizedFormFile(byte[] fileData, string fileName, string contentType)
            {
                _fileData = fileData ?? throw new ArgumentNullException(nameof(fileData));
                _fileName = fileName ?? "optimized-image.jpg";
                _contentType = contentType ?? "image/jpeg";
                Length = _fileData.Length;
            }

            public string ContentType => _contentType;
            public string ContentDisposition => $"form-data; name=\"file\"; filename=\"{_fileName}\"";
            public IHeaderDictionary Headers => new HeaderDictionary();
            public long Length { get; }
            public string Name => "file";
            public string FileName => _fileName;

            public void CopyTo(Stream target)
            {
                if (target == null)
                    throw new ArgumentNullException(nameof(target));

                target.Write(_fileData, 0, _fileData.Length);
            }

            public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
            {
                if (target == null)
                    throw new ArgumentNullException(nameof(target));

                await target.WriteAsync(_fileData, cancellationToken);
            }

            public Stream OpenReadStream()
            {
                return new MemoryStream(_fileData, false);
            }
        }

        #endregion
    }
}