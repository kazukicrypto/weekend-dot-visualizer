import SwiftUI

struct SummaryView: View {
    @Environment(WeekendStore.self) private var store

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Big number
                    bigNumberCard

                    // Progress ring
                    progressRing

                    // Category breakdown
                    categoryBreakdown

                    // Unassigned notice
                    if store.unassignedDays > 0 {
                        unassignedCard
                    }
                }
                .padding()
            }
            .navigationTitle("まとめ")
        }
    }

    private var bigNumberCard: some View {
        VStack(spacing: 8) {
            Text("\(store.totalWeekendDays)")
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)

            Text("\(store.selectedYear)年の土日")
                .font(.title3)
                .foregroundStyle(.secondary)

            HStack(spacing: 24) {
                VStack {
                    Text("\(store.pastDays)")
                        .font(.title2.bold())
                    Text("使った日")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                VStack {
                    Text("\(store.remainingDays)")
                        .font(.title2.bold())
                        .foregroundStyle(.blue)
                    Text("残りの日")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var progressRing: some View {
        VStack(spacing: 12) {
            Text("消化率")
                .font(.headline)

            ZStack {
                Circle()
                    .stroke(.gray.opacity(0.2), lineWidth: 12)

                Circle()
                    .trim(from: 0, to: progressValue)
                    .stroke(
                        AngularGradient(
                            colors: [.blue, .purple, .pink, .blue],
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 1), value: progressValue)

                VStack {
                    Text("\(Int(progressValue * 100))%")
                        .font(.title.bold())
                    Text("経過")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 140, height: 140)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var progressValue: Double {
        guard store.totalWeekendDays > 0 else { return 0 }
        return Double(store.pastDays) / Double(store.totalWeekendDays)
    }

    private var categoryBreakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("カテゴリ別")
                .font(.headline)

            if store.categoryBreakdown.isEmpty {
                Text("まだカテゴリが割り当てられていません")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(store.categoryBreakdown, id: \.category.id) { item in
                    HStack {
                        Text(item.category.emoji)
                            .font(.title3)

                        Text(item.category.name)
                            .font(.subheadline)

                        Spacer()

                        Text("\(item.count)日")
                            .font(.subheadline.bold())
                            .monospacedDigit()

                        // Mini bar
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(item.category.color)
                                .frame(
                                    width: geo.size.width * barRatio(for: item.count),
                                    height: geo.size.height
                                )
                        }
                        .frame(width: 80, height: 16)
                        .background(
                            RoundedRectangle(cornerRadius: 4)
                                .fill(.gray.opacity(0.1))
                        )
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private func barRatio(for count: Int) -> CGFloat {
        guard let maxCount = store.categoryBreakdown.first?.count, maxCount > 0 else { return 0 }
        return CGFloat(count) / CGFloat(maxCount)
    }

    private var unassignedCard: some View {
        HStack {
            Image(systemName: "circle.dashed")
                .font(.title2)
                .foregroundStyle(.orange)

            VStack(alignment: .leading) {
                Text("\(store.unassignedDays)日が未割当")
                    .font(.subheadline.bold())
                Text("ドットタブで予定を入れましょう")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}
