using Microsoft.AspNetCore.Http;
using GaStore.Shared.Uploads;

namespace GaStore.Core.Services.Interfaces
{
    public interface IUploadServiceClient
    {
        bool IsEnabled { get; }
        Task<FileUploadResponse> UploadImageAsync(IFormFile file, string? uploadPath = null, CancellationToken cancellationToken = default);
        Task<FileUploadResponse> UploadFileAsync(IFormFile file, string? uploadPath = null, string? category = null, CancellationToken cancellationToken = default);
        Task<DeleteFileResponse> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
    }
}
