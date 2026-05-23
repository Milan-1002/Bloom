// react-pdf Document component for the Bloom Doctor-Ready Report.
// NOTE: This file is intentionally NOT a DOM component — it renders to PDF only.
// Hex colour values in StyleSheet.create are required because CSS variables (var(--b-*))
// are unavailable in react-pdf's PDF render context. This does NOT violate CLAUDE.md Rule 8
// (which applies only to src/components/ui/ DOM components).

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { ReportStats, ReportWindow } from '@/lib/report-stats'

// ─── Brand colour constants (hex — CSS vars not available in react-pdf) ───────

const C = {
  ink:     '#1a1a2e',
  ink2:    '#4a4a6a',
  ink3:    '#9090b0',
  primary: '#8b5cf6',
  coral:   '#f97316',
  fiber:   '#0ea5e9',
  mint:    '#10b981',
  bg:      '#f8f7ff',
  surface: '#ffffff',
  hairline:'#e8e6f0',
} as const

// ─── Stylesheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 10,
    color: C.ink,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: C.primary, marginBottom: 4 },
  subtitle: { fontSize: 10, color: C.ink3 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 10,
    border: `1px solid ${C.hairline}`,
  },
  statLabel: {
    fontSize: 8,
    color: C.ink3,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: C.ink },
  statUnit: { fontSize: 9, color: C.ink3 },
  chartImage: { width: '100%', borderRadius: 8, marginBottom: 8 },
  redFlagBox: {
    backgroundColor: '#fff3ef',
    borderRadius: 8,
    padding: 12,
    border: `1px solid ${C.coral}`,
    marginBottom: 8,
  },
  redFlagTitle: { fontSize: 11, fontWeight: 'bold', color: C.coral, marginBottom: 6 },
  redFlagItem: { fontSize: 9, color: C.ink2, marginBottom: 3 },
  mealBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    border: `1px solid ${C.hairline}`,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealLabel: { fontSize: 9, color: C.ink3 },
  mealValue: { fontSize: 9, fontWeight: 'bold', color: C.ink },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: C.ink3,
  },
  divider: {
    borderBottom: `1px solid ${C.hairline}`,
    marginBottom: 16,
    marginTop: 4,
  },
})

// ─── Local helper functions (not exported) ─────────────────────────────────────

function fmtHour(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  const ap = hr < 12 ? 'am' : 'pm'
  const d = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
  return `${d}:${String(min).padStart(2, '0')}${ap}`
}

function fmtHours(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return min > 0 ? `${hr}h ${min}m` : `${hr}h`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Exported interface ────────────────────────────────────────────────────────

export interface ReportDocumentProps {
  chartImageUrl: string   // PNG data URL from html2canvas
  stats: ReportStats
  windowDays: ReportWindow
  windowLabel: string     // human label: '30d', 'YTD', '14d', etc.
  generatedAt: string     // 'YYYY-MM-DD' string (today's date)
}

// ─── Exported component ────────────────────────────────────────────────────────

export function ReportDocument({
  chartImageUrl,
  stats,
  windowDays,
  windowLabel,
  generatedAt,
}: ReportDocumentProps) {
  return (
    <Document title={`Bloom Health Report — ${windowLabel} — ${generatedAt}`}>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bloom Health Report</Text>
          <Text style={styles.subtitle}>
            {windowLabel} summary · Generated {fmtDate(generatedAt)} · {stats.daysWithData} days with logged data
          </Text>
        </View>
        <View style={styles.divider} />

        {/* Executive summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg Daily GL</Text>
              <Text style={styles.statValue}>{stats.avgGL.toFixed(1)}</Text>
              <Text style={styles.statUnit}>GL / day</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg Fiber</Text>
              <Text style={styles.statValue}>{stats.avgFiber.toFixed(1)}</Text>
              <Text style={styles.statUnit}>g / day</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Weight Change</Text>
              <Text style={styles.statValue}>
                {stats.weightChange != null
                  ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange}`
                  : '—'}
              </Text>
              <Text style={styles.statUnit}>{stats.weightChange != null ? 'kg' : ''}</Text>
            </View>
            {stats.cycleLengthDays != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Cycle Length</Text>
                <Text style={styles.statValue}>{stats.cycleLengthDays}</Text>
                <Text style={styles.statUnit}>days</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chart image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GL &amp; Symptom Timeline</Text>
          <Image src={chartImageUrl} style={styles.chartImage} />
        </View>

        {/* Red-flag streaks */}
        {stats.redFlagStreaks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>High GL Periods</Text>
            <View style={styles.redFlagBox}>
              <Text style={styles.redFlagTitle}>
                {'⚠'} {stats.redFlagStreaks.length} High GL Period{stats.redFlagStreaks.length > 1 ? 's' : ''} Detected
              </Text>
              {stats.redFlagStreaks.map((s) => (
                <Text key={s.startDate} style={styles.redFlagItem}>
                  {fmtDate(s.startDate)} {'–'} {fmtDate(s.endDate)} ({s.days} days) — GL averaged {Math.round(s.avgOveragePct)}% above target
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Meal patterns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Patterns</Text>
          <View style={styles.mealBox}>
            {stats.mealTiming ? (
              <>
                <View style={styles.mealRow}>
                  <Text style={styles.mealLabel}>Avg eating window</Text>
                  <Text style={styles.mealValue}>{fmtHours(24 - stats.mealTiming.avgFastingWindowHours)}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealLabel}>Avg first meal</Text>
                  <Text style={styles.mealValue}>{fmtHour(stats.mealTiming.avgFirstMealHour)}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealLabel}>Avg last meal</Text>
                  <Text style={styles.mealValue}>{fmtHour(stats.mealTiming.avgLastMealHour)}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealLabel}>Avg fasting window</Text>
                  <Text style={styles.mealValue}>{fmtHours(stats.mealTiming.avgFastingWindowHours)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.mealLabel}>Not enough data to calculate meal timing.</Text>
            )}
            <View style={{ marginTop: 8 }}>
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Breakfast</Text>
                <Text style={styles.mealValue}>{stats.mealSlotDistribution.breakfast}%</Text>
              </View>
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Lunch</Text>
                <Text style={styles.mealValue}>{stats.mealSlotDistribution.lunch}%</Text>
              </View>
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Dinner</Text>
                <Text style={styles.mealValue}>{stats.mealSlotDistribution.dinner}%</Text>
              </View>
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Snack</Text>
                <Text style={styles.mealValue}>{stats.mealSlotDistribution.snack}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Bloom — PCOS Nutrition Companion · {generatedAt}
        </Text>

      </Page>
    </Document>
  )
}
