export function exportToCSV(data, filename) {
  if (!data || !data.length) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(","),
    // Data rows
    ...data.map((row) => {
      return headers
        .map((header) => {
          let value = row[header];

          // Handle null/undefined
          if (value === null || value === undefined) {
            return "";
          }

          // Handle objects (like tenant details nested in payment)
          if (typeof value === "object") {
            // specific handling for common nested objects if needed,
            // but for generic generic depth 1, we might just stringify or pick a name property if commonly used
            // For this app, let's try to be smart about nested objects usually having a name property
            if (value.name) return `"${value.name}"`;
            if (value.roomNumber) return `"${value.roomNumber}"`;
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`; // Escape double quotes
          }

          // Convert to string and handle special characters
          const stringValue = String(value);

          // Wrap in quotes if it contains comma, newline or quotes
          if (
            stringValue.includes(",") ||
            stringValue.includes("\n") ||
            stringValue.includes('"')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }

          return stringValue;
        })
        .join(",");
    }),
  ].join("\n");

  // Create blob and download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create download URL
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
