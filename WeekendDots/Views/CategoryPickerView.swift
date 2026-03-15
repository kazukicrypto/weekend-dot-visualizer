import SwiftUI

struct CategoryPickerView: View {
    @Environment(WeekendStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let day: WeekendDay

    @State private var noteText: String = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Date header
                VStack(spacing: 4) {
                    Text(day.formattedDate)
                        .font(.title2.bold())

                    if let category = store.category(for: day) {
                        Text("現在: \(category.emoji) \(category.name)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.top)

                // Category grid
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 90), spacing: 12)],
                    spacing: 12
                ) {
                    // Clear button
                    CategoryButton(
                        emoji: "⬜",
                        name: "なし",
                        color: .gray.opacity(0.2),
                        isSelected: day.categoryID == nil
                    ) {
                        store.assignCategory(nil, to: day.id)
                        dismiss()
                    }

                    ForEach(store.categories) { category in
                        CategoryButton(
                            emoji: category.emoji,
                            name: category.name,
                            color: category.color,
                            isSelected: day.categoryID == category.id
                        ) {
                            store.assignCategory(category.id, to: day.id)
                            dismiss()
                        }
                    }
                }
                .padding(.horizontal)

                // Note field
                VStack(alignment: .leading, spacing: 6) {
                    Text("メモ")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("この日の予定やメモ...", text: $noteText)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            store.updateNote(noteText, for: day.id)
                        }
                }
                .padding(.horizontal)

                Spacer()
            }
            .navigationTitle("カテゴリを選択")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("閉じる") { dismiss() }
                }
            }
            .onAppear {
                noteText = day.note
            }
            .onDisappear {
                if noteText != day.note {
                    store.updateNote(noteText, for: day.id)
                }
            }
        }
    }
}

struct CategoryButton: View {
    let emoji: String
    let name: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(emoji)
                    .font(.title2)
                Text(name)
                    .font(.caption)
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(isSelected ? 0.4 : 0.15))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(isSelected ? color : .clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}
