namespace GaStore.Shared.Uploads
{
    public class DeleteFileResponse
    {
        public bool IsSuccess { get; set; }
        public string? FileUrl { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
