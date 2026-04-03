using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Core.Utilities
{
	public class Randoms
	{
		public static string Strings(int length)
		{
			StringBuilder str_build = new StringBuilder();
			Random random = new Random();

			char letter;

			for (int i = 0; i < length; i++)
			{
				double flt = random.NextDouble();
				int shift = Convert.ToInt32(Math.Floor(25 * flt));
				letter = Convert.ToChar(shift + 65);
				str_build.Append(letter);
			}
			return str_build.ToString();
		}

		public static string Numbers(int length)
		{
			StringBuilder str_build = new StringBuilder();
			Random random = new Random();

			string nums;

			for (int i = 0; i < length; i++)
			{
				nums = random.Next(10).ToString();
				str_build.Append(nums);
			}
			return str_build.ToString();
		}
	}
}
