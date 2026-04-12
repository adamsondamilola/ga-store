using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Shared.Uploads;
using GaStore.UploadService.Services;

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

        public UploadsController(
            IImageUploadService imageUploadService,
            IFileUploadService fileUploadService,
            IOptions<UploadServiceOptions> uploadServiceOptions)
        {
            _imageUploadService = imageUploadService;
            _fileUploadService = fileUploadService;
            _uploadServiceOptions = uploadServiceOptions.Value;
        }

        [HttpPost("images")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadImage([FromForm] IFormFile file, [FromForm] string? uploadPath = null)
        {
            if (!HasValidApiKey())
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
            if (!HasValidApiKey())
            {
                return Unauthorized();
            }

            var response = await _fileUploadService.UploadAsync(file, uploadPath, category);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpDelete]
        public async Task<ActionResult<DeleteFileResponse>> DeleteFile([FromQuery] string fileUrl)
        {
            if (!HasValidApiKey())
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

        private bool HasValidApiKey()
        {
            if (string.IsNullOrWhiteSpace(_uploadServiceOptions.ApiKey))
            {
                return true;
            }

            if (!Request.Headers.TryGetValue(ApiKeyHeaderName, out var headerValue))
            {
                return false;
            }

            return string.Equals(headerValue.ToString(), _uploadServiceOptions.ApiKey, StringComparison.Ordinal);
        }
    }
}
