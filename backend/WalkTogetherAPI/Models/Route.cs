using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WalkTogether.Domain.Entities
{
    public class Route
    {
        [Key]
        [Column("route_id")]
        public Guid Id { get; set; }

        [Column("distance")]
        public int Distance { get; set; }

        public ICollection<Destination>? Destinations { get; set; }
        public ICollection<Event>? Events { get; set; }
    }
}
