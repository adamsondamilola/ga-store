using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    public class GigStatusMap
    {
        private static readonly Dictionary<string, string> Data = new()
{
    { "ACC", "Shipment Arrives Collation Center" },
    { "AD", "Available for Pickup" },
    { "APT", "Arrived Processing Center in Transit" },
    { "ARF", "Arrived Final Destination" },
    { "ARO", "Arrived Operations" },
    { "ARP", "Arrived Processing Center" },
    { "CLS", "Claims Shipment" },
    { "CRT", "Shipment Created" },
    { "DCC", "Shipment Departs Collation Center" },
    { "DFA", "Delivery Unsuccessful" },
    { "DLD", "Delayed Delivery" },
    { "DLP", "Delayed Pickup" },
    { "DPC", "Departs Processing Center" },
    { "DSC", "Departs Service Center" },
    { "DUBC", "Delayed Pickup by Customer" },
    { "FMS", "Found Missing Shipment" },
    { "MAFD", "Shipment Arrived Final Destination" },
    { "MAHD", "Shipment Delivered" },
    { "MAPT", "Shipment Assigned for Pickup" },
    { "MATD", "Delivery Attempt Messaging" },
    { "MCRT", "Shipment Created by Customer" },
    { "MENP", "Shipment Enroute Pickup" },
    { "MPIK", "Shipment Picked Up" },
    { "MRTD", "Shipment Rerouted" },
    { "MRTE", "Shipment Enroute Return" },
    { "MSCC", "Shipment Cancelled by Customer" },
    { "MSCP", "Shipment Cancelled by Delivery Partner" },
    { "MSHC", "Shipment Enroute Delivery" },
    { "MSVC", "Shipment Arrived Service Centre for Onward Processing" },
    { "OFDU", "Out for Delivery" },
    { "OKC", "Delivered" },
    { "OKT", "Delivered at Terminal" },
    { "PICKED", "Shipment Picked Up for Delivery" },
    { "RTNINIT", "Return Initiated" },
    { "SDR", "Shipment Destroyed" },
    { "SHD", "Shipment Delivered" },
    { "SMIM", "Shipment Not Found During Manifest" },
    { "SRC", "Returned to Service Centre" },
    { "SRHUB", "Returned to Hub" },
    { "SSC", "Shipment Cancelled" },
    { "SSR", "Shipment Returned" },
    { "WC", "With Delivery Courier" }
};

    }
}
