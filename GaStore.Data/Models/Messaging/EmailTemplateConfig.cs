using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models.Messaging
{
    public class CompanyConfig
    {
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyWebsite { get; set; } = string.Empty;
        public string CompanyAddress { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
    }
}
