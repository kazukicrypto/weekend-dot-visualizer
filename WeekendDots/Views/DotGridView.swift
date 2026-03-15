import SwiftUI

struct DotGridView: View {
    @Environment(WeekendStore.self) private var store
    @State private var selectedDay: WeekendDay?
    @State private var showingCategoryPicker = false

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 10)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Year selector
                    yearSelector

                    // Header stats
                    headerStats

                    // Legend
                    legendView

                    // Dot grid by month
                    ForEach(store.daysByMonth, id: \.month) { monthGroup in
                        monthSection(month: monthGroup.month, days: monthGroup.days)
                    }
                }
                .padding()
            }
            .navigationTitle("土日ドット")
            .sheet(isPresented: $showingCategoryPicker) {
                if let day = selectedDay {
                    CategoryPickerView(day: day)
                        .presentationDetents([.medium])
                }
            }
        }
    }

    private var yearSelector: some View {
        HStack {
            Button {
                store.changeYear(to: store.selectedYear - 1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3.bold())
            }

            Text("\(String(store.selectedYear))年")
                .font(.title2.bold())
                .monospacedDigit()
                .frame(minWidth: 100)

            Button {
                store.changeYear(to: store.selectedYear + 1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title3.bold())
            }
        }
        .padding(.vertical, 4)
    }

    private var headerStats: some View {
        HStack(spacing: 20) {
            StatBadge(
                value: "\(store.totalWeekendDays)",
                label: "土日の合計",
                color: .secondary
            )
            StatBadge(
                value: "\(store.remainingDays)",
                label: "残りの日数",
                color: .blue
            )
            StatBadge(
                value: "\(store.unassignedDays)",
                label: "未割当",
                color: .orange
            )
        }
    }

    private var legendView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                legendItem(color: .gray.opacity(0.3), label: "未割当")
                ForEach(store.categories) { category in
                    legendItem(color: category.color, label: "\(category.emoji) \(category.name)")
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func monthSection(month: Int, days: [WeekendDay]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(month)月")
                .font(.headline)
                .foregroundStyle(.secondary)

            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(days) { day in
                    DotView(day: day, category: store.category(for: day))
                        .onTapGesture {
                            selectedDay = day
                            showingCategoryPicker = true
                        }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Dot View

struct DotView: View {
    let day: WeekendDay
    let category: Category?

    var body: some View {
        ZStack {
            Circle()
                .fill(dotColor)
                .frame(width: dotSize, height: dotSize)

            if day.isToday {
                Circle()
                    .strokeBorder(.primary, lineWidth: 2)
                    .frame(width: dotSize + 4, height: dotSize + 4)
            }

            if day.isSaturday {
                Text("土")
                    .font(.system(size: 7, weight: .medium))
                    .foregroundStyle(textColor)
            } else {
                Text("日")
                    .font(.system(size: 7, weight: .medium))
                    .foregroundStyle(textColor)
            }
        }
    }

    private var dotSize: CGFloat { 28 }

    private var dotColor: Color {
        if let category = category {
            return category.color
        }
        return day.isPast ? .gray.opacity(0.2) : .gray.opacity(0.3)
    }

    private var textColor: Color {
        if category != nil {
            return .white.opacity(0.9)
        }
        return .secondary.opacity(0.6)
    }
}

// MARK: - Stat Badge

struct StatBadge: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.title3.bold())
                .monospacedDigit()
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
    }
}
