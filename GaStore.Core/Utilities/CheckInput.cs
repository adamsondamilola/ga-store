using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Core.Utilities
{
	public class CheckInput
	{
		public static string PhoneNumber(string Phone)
		{
			string? Result = null;
			if (Phone == null)
			{
				Result = "Enter phone number";
			}
			else if (Phone.Substring(0, 1) != "0")
			{
				Result = "Phone number should start with zero";
			}
			else if (Phone.Length < 11 || Phone.Length > 11)
			{
				Result = "Phone number should not be more than 11-digits";
			}
			else if (!long.TryParse(Phone, out long n))
			{
				Result = "Phone number is invalid";
			}

			return Result;
		}

		public static string AccountNumber(string Num)
		{
			string? Result = null;
			if (Num == null)
			{
				Result = "Enter account number";
			}
			else if (Num.Length < 10 || Num.Length > 10)
			{
				Result = "Account number should not be more than 10-digits";
			}
			else if (!long.TryParse(Num, out long n))
			{
				Result = "Account number is invalid";
			}

			return Result;
		}

		public static string Password(string password)
		{
			string? result = null;

			if (string.IsNullOrWhiteSpace(password))
			{
				result = "Enter password.";
			}
			else if (password.Length < 8) // Increased minimum length
			{
				result = "Password should not be less than 8 characters.";
			}
			else if (!password.Any(char.IsUpper)) // Must contain an uppercase letter
			{
				result = "Password should have at least one uppercase letter.";
			}
			else if (!password.Any(char.IsLower)) // Must contain a lowercase letter
			{
				result = "Password should have at least one lowercase letter.";
			}
			else if (!password.Any(char.IsDigit)) // Must contain a digit
			{
				result = "Password should have at least one digit.";
			}
			else if (!password.Any(ch => "!@#$%^&*()_-+=<>?/".Contains(ch))) // Must contain a special character
			{
				result = "Password should have at least one special character.";
			}
			else if (password.GroupBy(c => c).Any(g => g.Count() > password.Length / 2)) // Prevent repetitive characters
			{
				result = "Password contains too many repeated characters.";
			}
			else
			{
				result = null;
			}

			return result;
		}


		public static string Pin(string Password)
		{
			string? Result = null;
			if (Password == null)
			{
				Result = "Enter pin";
			}
			else if (Password.Length < 4 || Password.Length > 4)
			{
				Result = "Pin should not be more than 4-digits";
			}
			else if (!long.TryParse(Password, out long n))
			{
				Result = "Pin should be in numbers";
			}

			else if (Password[0] == Password[1] && Password[0] == Password[2] && Password[0] == Password[3])
			{
				Result = "Pin is too weak";
			}

			return Result;
		}

		public static string Email(string Email)
		{
			string? Result = null;
			if (Email == null)
			{
				Result = "Enter email";
			}
			else if (Email.Trim().EndsWith(".")) Result = "Invalid email address";
			else
			{
				try
				{
					MailAddress mail = new MailAddress(Email);
					if (mail.Address == Email) Result = null;
					else Result = "Email not accepted";
				}
				catch
				{
					Result = "Invalid email format";
				}
			}

			return Result;

		}

		public static bool IsNumberic(string num)
		{
			bool Result = false;
			if (num == null)
			{
				Result = false;
			}
			else if (!long.TryParse(num, out long n))
			{
				Result = false;
			}
			else
			{
				Result = true;
			}

			return Result;
		}
	}
}
