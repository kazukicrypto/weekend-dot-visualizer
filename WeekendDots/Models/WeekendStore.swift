import Foundation
import SwiftUI

@Observable
class WeekendStore {
    var weekendDays: [WeekendDay] = []
    var categories: [Category] = []
    var selectedYear: Int

    private let userDefaults = UserDefaults.standard
    private let weekendDaysKey = "weekendDays"
    private let categoriesKey = "categories"

    init() {
        self.selectedYear = Calendar.current.component(.year, from: Date())
        loadCategories()
        loadWeekendDays()

        if weekendDays.isEmpty {
            generateWeekendDays(for: selectedYear)
        }
    }

    // MARK: - Weekend Day Generation

    func generateWeekendDays(for year: Int) {
        var calendar = Calendar.current
        calendar.locale = Locale(identifier: "ja_JP")

        var days: [WeekendDay] = []
        var dateComponents = DateComponents()
        dateComponents.year = year
        dateComponents.month = 1
        dateComponents.day = 1

        guard let startDate = calendar.date(from: dateComponents) else { return }

        dateComponents.year = year + 1
        guard let endDate = calendar.date(from: dateComponents) else { return }

        var current = startDate
        while current < endDate {
            let weekday = calendar.component(.weekday, from: current)
            if weekday == 1 || weekday == 7 { // Sunday or Saturday
                // Preserve existing assignments
                if let existing = weekendDays.first(where: { calendar.isDate($0.date, inSameDayAs: current) }) {
                    days.append(existing)
                } else {
                    days.append(WeekendDay(date: current))
                }
            }
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }

        weekendDays = days
        save()
    }

    func changeYear(to year: Int) {
        selectedYear = year
        generateWeekendDays(for: year)
    }

    // MARK: - Category Assignment

    func assignCategory(_ categoryID: UUID?, to dayID: UUID) {
        if let index = weekendDays.firstIndex(where: { $0.id == dayID }) {
            weekendDays[index].categoryID = categoryID
            save()
        }
    }

    func updateNote(_ note: String, for dayID: UUID) {
        if let index = weekendDays.firstIndex(where: { $0.id == dayID }) {
            weekendDays[index].note = note
            save()
        }
    }

    func category(for day: WeekendDay) -> Category? {
        guard let categoryID = day.categoryID else { return nil }
        return categories.first(where: { $0.id == categoryID })
    }

    // MARK: - Category Management

    func addCategory(_ category: Category) {
        categories.append(category)
        save()
    }

    func deleteCategory(_ category: Category) {
        categories.removeAll(where: { $0.id == category.id })
        // Clear assignments for deleted category
        for i in weekendDays.indices {
            if weekendDays[i].categoryID == category.id {
                weekendDays[i].categoryID = nil
            }
        }
        save()
    }

    func updateCategory(_ category: Category) {
        if let index = categories.firstIndex(where: { $0.id == category.id }) {
            categories[index] = category
            save()
        }
    }

    // MARK: - Statistics

    var totalWeekendDays: Int {
        weekendDays.count
    }

    var assignedDays: Int {
        weekendDays.filter { $0.categoryID != nil }.count
    }

    var unassignedDays: Int {
        totalWeekendDays - assignedDays
    }

    var pastDays: Int {
        weekendDays.filter { $0.isPast }.count
    }

    var remainingDays: Int {
        weekendDays.filter { !$0.isPast && !$0.isToday }.count
    }

    func daysForCategory(_ category: Category) -> Int {
        weekendDays.filter { $0.categoryID == category.id }.count
    }

    var categoryBreakdown: [(category: Category, count: Int)] {
        categories.compactMap { category in
            let count = daysForCategory(category)
            return count > 0 ? (category: category, count: count) : nil
        }.sorted { $0.count > $1.count }
    }

    // MARK: - Grouped by Month

    var daysByMonth: [(month: Int, days: [WeekendDay])] {
        let grouped = Dictionary(grouping: weekendDays) { $0.monthNumber }
        return grouped.sorted { $0.key < $1.key }.map { (month: $0.key, days: $0.value) }
    }

    // MARK: - Persistence

    private func save() {
        if let encoded = try? JSONEncoder().encode(weekendDays) {
            userDefaults.set(encoded, forKey: weekendDaysKey)
        }
        if let encoded = try? JSONEncoder().encode(categories) {
            userDefaults.set(encoded, forKey: categoriesKey)
        }
    }

    private func loadWeekendDays() {
        if let data = userDefaults.data(forKey: weekendDaysKey),
           let decoded = try? JSONDecoder().decode([WeekendDay].self, from: data) {
            weekendDays = decoded
        }
    }

    private func loadCategories() {
        if let data = userDefaults.data(forKey: categoriesKey),
           let decoded = try? JSONDecoder().decode([Category].self, from: data) {
            categories = decoded
        } else {
            categories = Category.defaults
        }
    }
}
