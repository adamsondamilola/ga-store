using Microsoft.AspNetCore.Http;
using GaStore.Shared.Uploads;

namespace GaStore.UploadService.Services
{
    public interface IFileUploadService
    {
        Task<FileUploadResponse> UploadAsync(IFormFile file, string? uploadPath = null, string? category = null);
        Task<DeleteFileResponse> DeleteAsync(string fileUrl);
    }
}
