using Microsoft.AspNetCore.Http;
using System;

namespace GaStore.Data.Dtos
{
	public class SendMailDto
	{
		public string? ReceiverEmail { get; set; }
		public string? Subject { get; set; }
		public string? MessageBody { get; set; }
		public List<IFormFile>? Attachment { get; set; }
	}
}
