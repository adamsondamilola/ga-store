using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Models;
using GaStore.Shared;

namespace GaStore.Core.Utilities
{
	public class Encryption
	{
		private readonly AppSettings _appSettings;
		public Encryption(IOptions<AppSettings> appSettings)
		{
			_appSettings = appSettings.Value;
		}

		public static string encriptionKey = "6kNBrJD3zYpS7X4cuFH2wgCbEvhG";
		public static string Encrypt(string Text)
		{
			string? EncriptionKey = encriptionKey;
			byte[] bytes = Encoding.Unicode.GetBytes(Text);
			using (Aes aes = Aes.Create())
			{
				Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(EncriptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76, 0x00, 0x00, 0x00 });
				aes.Key = pdb.GetBytes(32);
				aes.IV = pdb.GetBytes(16);
				using (MemoryStream ms = new MemoryStream())
				{
					using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
					{
						cs.Write(bytes, 0, bytes.Length);
						cs.Close();
					}
					Text = Convert.ToBase64String(ms.ToArray());
				}
			}
			return Text;
		}

		public static string Decrypt(string encrytedText)
		{
			string? EncriptionKey = encriptionKey;
			encrytedText = encrytedText.Replace(" ", "+");
			byte[] bytes = Convert.FromBase64String(encrytedText);
			using (Aes aes = Aes.Create())
			{
				Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(EncriptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76, 0x00, 0x00, 0x00 });
				aes.Key = pdb.GetBytes(32);
				aes.IV = pdb.GetBytes(16);
				using (MemoryStream ms = new MemoryStream())
				{
					using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
					{
						cs.Write(bytes, 0, bytes.Length);
						cs.Close();
					}
					encrytedText = Encoding.Unicode.GetString(ms.ToArray());
				}
			}
			return encrytedText;
		}

		public static T DecryptJson<T>(string encryptedJson)
		{
			string? EncriptionKey = encriptionKey;

			if (string.IsNullOrEmpty(EncriptionKey))
			{
				throw new ArgumentNullException(nameof(EncriptionKey), "Encryption key cannot be null or empty.");
			}

			encryptedJson = encryptedJson.Replace(" ", "+");
			byte[] encryptedBytes = Convert.FromBase64String(encryptedJson);

			using (Aes aes = Aes.Create())
			{
				var pdb = new Rfc2898DeriveBytes(EncriptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76, 0x00, 0x00, 0x00 });

				aes.Key = pdb.GetBytes(32); // 256-bit key
				aes.IV = pdb.GetBytes(16);  // 128-bit IV

				using (MemoryStream ms = new MemoryStream(encryptedBytes))
				using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read))
				using (StreamReader sr = new StreamReader(cs))
				{
					string json = sr.ReadToEnd();
					return JsonConvert.DeserializeObject<T>(json);
				}
			}
		}


		public static bool DecryptPassword(string Text, string encrytedText)
		{
			try
			{
				string pass = Decrypt(encrytedText);
				if (pass == Text) return true;
				else return false;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return false;
			}
		}

	}
}
