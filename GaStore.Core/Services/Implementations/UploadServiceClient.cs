using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GaStore.Core.Services.Interfaces;
using GaStore.Shared.Uploads;

namespace GaStore.Core.Services.Implementations
{
    public class UploadServiceClient : IUploadServiceClient
    {
        private const string ApiKeyHeaderName = "X-Upload-Service-Key";

        private readonly HttpClient _httpClient;
        private readonly UploadServiceOptions _options;
        private readonly ILogger<UploadServiceClient> _logger;

        public UploadServiceClient(
            HttpClient httpClient,
            IOptions<UploadServiceOptions> options,
            ILogger<UploadServiceClient> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;

            if (!string.IsNullOrWhiteSpace(_options.BaseUrl))
            {
                _httpClient.BaseAddress = new Uri(_options.BaseUrl);
            }
        }

        public bool IsEnabled => _options.Enabled && _httpClient.BaseAddress != null;

        public Task<FileUploadResponse> UploadImageAsync(IFormFile file, string? uploadPath = null, CancellationToken cancellationToken = default)
        {
            return UploadAsync("api/uploads/images", file, uploadPath, null, cancellationToken);
        }

        public Task<FileUploadResponse> UploadFileAsync(IFormFile file, string? uploadPath = null, string? category = null, CancellationToken cancellationToken = default)
        {
            return UploadAsync("api/uploads/files", file, uploadPath, category, cancellationToken);
        }

        public async Task<DeleteFileResponse> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
        {
            if (!IsEnabled)
            {
                return new DeleteFileResponse { FileUrl = fileUrl, ErrorMessage = "Upload service is not enabled." };
            }

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Delete, $"api/uploads?fileUrl={Uri.EscapeDataString(fileUrl)}");
                AddApiKey(request.Headers);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                var payload = await response.Content.ReadFromJsonAsync<DeleteFileResponse>(cancellationToken: cancellationToken);

                return payload ?? new DeleteFileResponse
                {
                    FileUrl = fileUrl,
                    ErrorMessage = response.IsSuccessStatusCode ? null : "Upload service returned an empty response."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file through upload service: {FileUrl}", fileUrl);
                return new DeleteFileResponse { FileUrl = fileUrl, ErrorMessage = "Could not reach upload service." };
            }
        }

        private async Task<FileUploadResponse> UploadAsync(string endpoint, IFormFile file, string? uploadPath, string? category, CancellationToken cancellationToken)
        {
            if (!IsEnabled)
            {
                return new FileUploadResponse { ErrorMessage = "Upload service is not enabled." };
            }

            try
            {
                await using var fileStream = file.OpenReadStream();
                using var streamContent = new StreamContent(fileStream);
                streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType ?? "application/octet-stream");

                using var form = new MultipartFormDataContent
                {
                    { streamContent, "file", file.FileName }
                };

                if (!string.IsNullOrWhiteSpace(uploadPath))
                {
                    form.Add(new StringContent(uploadPath), "uploadPath");
                }

                if (!string.IsNullOrWhiteSpace(category))
                {
                    form.Add(new StringContent(category), "category");
                }

                using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = form
                };

                AddApiKey(request.Headers);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                var payload = await response.Content.ReadFromJsonAsync<FileUploadResponse>(cancellationToken: cancellationToken);

                return payload ?? new FileUploadResponse
                {
                    ErrorMessage = response.IsSuccessStatusCode ? null : "Upload service returned an empty response."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file through upload service: {FileName}", file.FileName);
                return new FileUploadResponse { ErrorMessage = "Could not reach upload service." };
            }
        }

        private void AddApiKey(HttpRequestHeaders headers)
        {
            if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                headers.Add(ApiKeyHeaderName, _options.ApiKey);
            }
        }
    }
}
