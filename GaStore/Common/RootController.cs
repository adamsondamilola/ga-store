using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Security.Claims;

namespace GaStore.Common
{

	public class RootController : ControllerBase
	{
		public RootController()
		{
		}

		public DateTime CurrentDateTime
		{
			get
			{
				return DateTime.Now;
			}
		}

		public string AUTHUsername
		{
			get
			{
				var username = string.Empty;

				var claimsIdentity = HttpContext.User.Identity as ClaimsIdentity;
				var claim = claimsIdentity.Claims.First(x => x.Type == "UserName");
				if (claim != null)
				{
					username = claim.Value;
				}

				return username;
			}
		}

		public string AUTHEmail
		{
			get
			{
				var email = string.Empty;

				var claimsIdentity = HttpContext.User.Identity as ClaimsIdentity;
				var claim = claimsIdentity.Claims.First(x => x.Type == "Email");
				if (claim != null)
				{
					email = claim.Value;
				}

				return email;
			}
		}


		protected Guid UserId => Guid.Parse(FindClaim(ClaimTypes.NameIdentifier));

		private string? FindClaim(string claimName)
		{
			var claimsIdentity = HttpContext.User.Identity as ClaimsIdentity;
			var claim = claimsIdentity.Claims.First(x => x.Type == "UserId");
			if (claimsIdentity == null)
			{
				return null;
			}

			if (claim == null)
			{
				return null;
			}

			return claim.Value;
		}

		protected DateTime? IssuedTokenDate => GetTokenIssueDate(ClaimTypes.NameIdentifier);

		private DateTime? GetTokenIssueDate(string claimName)
		{
			var claimsIdentity = HttpContext.User.Identity as ClaimsIdentity;
			if (claimsIdentity.Claims.Count() > 0)
			{
				var claim = claimsIdentity.Claims.First(x => x.Type == "SessionActivated"); //Not using default JWT Token IAT due to limitations in accuracy with Unix Epoch NumericDate, instead provided a custom SessionActivated property to hold token IssueDate
				if (claimsIdentity == null)
				{
					return null;
				}

				if (claim == null)
				{
					return null;
				}

				DateTime issuedAt = DateTime.Parse(claim.Value);

				return issuedAt;
			}

			return null;
		}

		public string ClientIp
		{
			get
			{
				IPAddress ip;
				var headers = Request.Headers.ToList();
				if (headers.Exists((kvp) => kvp.Key == "X-Forwarded-For"))
				{
					// when running behind a load balancer you can expect this header
					var header = headers.First((kvp) => kvp.Key == "X-Forwarded-For").Value.ToString();
					// in case the IP contains a port, remove ':' and everything after
					ip = IPAddress.Parse(header.Remove(header.IndexOf(':')));
					return ip.ToString();
				}
				else
				{
					// this will always have a value (running locally in development won't have the header)
					ip = Request.HttpContext.Connection.RemoteIpAddress;
					return ip.ToString();
				}
			}
		}
	}
}
