using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    public class ShipmentTrackingResponse
    {
        public ShipmentTrackingObject Object { get; set; }
    }

    public class ShipmentTrackingObject
    {
        public string Origin { get; set; }
        public string Destination { get; set; }
        public List<MobileShipmentTracking> MobileShipmentTrackings { get; set; }
    }

    public class MobileShipmentTracking
    {
        public int MobileShipmentTrackingId { get; set; }
        public string Waybill { get; set; }
        public string Status { get; set; }
        public DateTime DateTime { get; set; }
        public int TrackingType { get; set; }
        public ScanStatus ScanStatus { get; set; }
        public int ServiceCentreId { get; set; }
    }

    public class ScanStatus
    {
        public int MobileScanStatusId { get; set; }
        public string Code { get; set; }
        public string Incident { get; set; }
        public string Reason { get; set; }
        public string Comment { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public bool IsDeleted { get; set; }
        public string RowVersion { get; set; }
    }

}
