using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.AuthDto
{
    public class OtpDto
    {
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int Status { get; set; } = 0;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public DateTime? Expires { get; set; }
    }
}
