using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Shared
{
	public class ServiceResponse<T>
	{
		public int StatusCode { get; set; }
		public string? Message { get; set; }
		public T? Data { get; set; }

        public static ServiceResponse<T> Success(T data, string message = "Success")
        {
            return new ServiceResponse<T>
            {
                StatusCode = 200,
                Message = message,
                Data = data
            };
        }

        public static ServiceResponse<T> Fail(string message, int statusCode = 400)
        {
            return new ServiceResponse<T>
            {
                StatusCode = statusCode,
                Message = message
            };
        }
    }
}
