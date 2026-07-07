const generateICSString = (event) => {
  const formatDate = (dateStr, timeStr) => {
    // Combine date and time to construct a proper Date object
    const d = new Date(dateStr);
    if (timeStr) {
      const [hrs, mins] = timeStr.split(":");
      d.setHours(parseInt(hrs) || 0);
      d.setMinutes(parseInt(mins) || 0);
    }
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatDate(event.date, event.time);
  // Default to 3 hours duration
  const end = new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000);
  if (event.time) {
    const [hrs, mins] = event.time.split(":");
    end.setHours(parseInt(hrs) || 0);
    end.setMinutes(parseInt(mins) || 0);
  }
  const endStr = end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventHub//Event Ticketing Platform//EN",
    "BEGIN:VEVENT",
    `UID:${event._id}@eventhub.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${start}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.venue}, ${event.city}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return lines.join("\r\n");
};

module.exports = { generateICSString };
