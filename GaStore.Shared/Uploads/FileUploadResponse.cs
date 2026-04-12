namespace GaStore.Shared.Uploads
{
    public class FileUploadResponse
    {
        public bool IsSuccess { get; set; }
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public string? FilePath { get; set; }
        public string? PublicId { get; set; }
        public string? ContentType { get; set; }
        public string? Extension { get; set; }
        public string? Provider { get; set; }
        public bool IsImage { get; set; }
        public long OriginalSize { get; set; }
        public long StoredSize { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
