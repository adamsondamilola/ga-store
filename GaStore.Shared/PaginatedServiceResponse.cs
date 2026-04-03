using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Shared
{
	public class PaginatedServiceResponse<T>
	{
		public int Status { get; set; }
		public string? Message { get; set; }
		public T? Data { get; set; }
		public int PageNumber { get; set; }
		public int PageSize { get; set; }
		public int TotalRecords { get; set; }
		public int TotalPages => (int)Math.Ceiling((double)TotalRecords / PageSize);
		public decimal TotalSalesAmount { get; set; } = 0;

        public Dictionary<string, object>? Metadata { get; set; }
	}
}
