import Foundation

struct WeekendDay: Identifiable, Codable {
    var id: UUID
    var date: Date
    var categoryID: UUID?
    var note: String

    init(id: UUID = UUID(), date: Date, categoryID: UUID? = nil, note: String = "") {
        self.id = id
        self.date = date
        self.categoryID = categoryID
        self.note = note
    }

    var isSaturday: Bool {
        Calendar.current.component(.weekday, from: date) == 7
    }

    var isSunday: Bool {
        Calendar.current.component(.weekday, from: date) == 1
    }

    var isPast: Bool {
        date < Calendar.current.startOfDay(for: Date())
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }

    var monthNumber: Int {
        Calendar.current.component(.month, from: date)
    }

    var dayNumber: Int {
        Calendar.current.component(.day, from: date)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.dateFormat = "M/d (E)"
        return formatter.string(from: date)
    }
}
