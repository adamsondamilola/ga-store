using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.Google
{
    public class ReCaptchaRequest
    {
        public string Token { get; set; }
    }

    public class RecaptchaVerifyResponseDto
    {
        public bool Success { get; set; }
        public float Score { get; set; }  // v3 only
        public string Action { get; set; }
        public string ChallengeTs { get; set; }
        public string Hostname { get; set; }
        public List<string> ErrorCodes { get; set; }
    }

}
