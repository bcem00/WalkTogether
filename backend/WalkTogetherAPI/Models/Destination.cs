using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WalkTogether.Domain.Entities
{
    public class Destination
    {
        [Key]
        [Column("destination_id")]
        public Guid Id { get; set; }

        [Column("longitude")]
        public double Longitude { get; set; }

        [Column("latitude")]
        public double Latitude { get; set; }

        [Column("route_id")]
        public Guid RouteId { get; set; }
        public Route? Route { get; set; }

        [Column("order_in_route")]
        public int OrderInRoute { get; set; }
    }
}
