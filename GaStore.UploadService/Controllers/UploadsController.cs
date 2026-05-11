using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Models.Database;
using GaStore.Shared.Uploads;
using GaStore.UploadService.Services;
using Microsoft.EntityFrameworkCore;

namespace GaStore.UploadService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {
        private const string ApiKeyHeaderName = "X-Upload-Service-Key";

        private readonly IImageUploadService _imageUploadService;
        private readonly IFileUploadService _fileUploadService;
        private readonly UploadServiceOptions _uploadServiceOptions;
        private readonly DatabaseContext _databaseContext;

        public UploadsController(
            IImageUploadService imageUploadService,
            IFileUploadService fileUploadService,
            IOptions<UploadServiceOptions> uploadServiceOptions,
            DatabaseContext databaseContext)
        {
            _imageUploadService = imageUploadService;
            _fileUploadService = fileUploadService;
            _uploadServiceOptions = uploadServiceOptions.Value;
            _databaseContext = databaseContext;
        }

        [HttpPost("images")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadImage([FromForm] IFormFile file, [FromForm] string? uploadPath = null)
        {
            if (!await HasValidApiKeyAsync())
            {
                return Unauthorized();
            }

            var result = await _imageUploadService.UploadAndOptimizeImageAsync(file, uploadPath ?? string.Empty);
            var response = new FileUploadResponse
            {
                IsSuccess = result.IsSuccess,
                FileName = result.FileName,
                FileUrl = result.ImageUrl,
                FilePath = result.FilePath,
                PublicId = result.PublicId,
                Provider = result.PublicId != null ? "cloudinary" : "local",
                IsImage = true,
                OriginalSize = result.OriginalSize,
                StoredSize = result.OptimizedSize,
                Width = result.Width,
                Height = result.Height,
                ErrorMessage = result.ErrorMessage
            };

            return result.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpPost("files")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadFile(
            [FromForm] IFormFile file,
            [FromForm] string? uploadPath = null,
            [FromForm] string? category = null)
        {
            if (!await HasValidApiKeyAsync())
            {
                return Unauthorized();
            }

            var response = await _fileUploadService.UploadAsync(file, uploadPath, category);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpDelete]
        public async Task<ActionResult<DeleteFileResponse>> DeleteFile([FromQuery] string fileUrl)
        {
            if (!await HasValidApiKeyAsync())
            {
                return Unauthorized();
            }

            var response = await _fileUploadService.DeleteAsync(fileUrl);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "ok" });
        }

        private async Task<bool> HasValidApiKeyAsync()
        {
            if (!Request.Headers.TryGetValue(ApiKeyHeaderName, out var headerValue))
            {
                return false;
            }

            var apiKey = headerValue.ToString().Trim();
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return false;
            }

            return await _databaseContext.UploadServiceApiKeys
                .AsNoTracking()
                .AnyAsync(x => x.IsActive && x.ApiKey == apiKey);
        }
    }
}
