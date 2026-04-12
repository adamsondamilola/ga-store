namespace GaStore.Shared.Uploads
{
    public class UploadServiceOptions
    {
        public const string SectionName = "UploadService";

        public bool Enabled { get; set; }
        public string? BaseUrl { get; set; }
        public string? ApiKey { get; set; }
    }
}
