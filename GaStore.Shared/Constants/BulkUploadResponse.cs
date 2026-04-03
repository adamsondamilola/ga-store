using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Shared.Constants
{
	public class BulkUploadResponse<T>
	{
		public int StatusCode { get; set; }
		public string Message { get; set; }
		public string OriginalFileName { get; set; }
		public int TotalRecords { get; set; }
		public int SuccessfulRecords { get; set; }
		public int FailedRecords { get; set; }
		public List<T> SuccessfulItems { get; set; } = new List<T>();
		public List<BulkUploadError> Errors { get; set; } = new List<BulkUploadError>();
		public TimeSpan ProcessingTime { get; set; }
		public DateTime ProcessedDate { get; set; } = DateTime.UtcNow;
        public string ErrorSummary { get; set; }
    }

	public class BulkUploadError
	{
		public int? RecordNumber { get; set; }
        public int RowNumber { get; set; }
        public object Record { get; set; }
		public string ErrorMessage { get; set; }
		public int StatusCode { get; set; }
		public string FieldName { get; set; }
	}
}
