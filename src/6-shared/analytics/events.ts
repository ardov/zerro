export type AnalyticsEventMap = {
  account_budget_membership_changed: {
    in_budget: boolean
    source: 'context_menu'
  }
  budget_automation_applied: {
    automation:
      'copy_previous' | 'fill_goals' | 'fix_overspends' | 'start_fresh'
  }
  budget_funds_moved: Record<string, never>
  budget_goal_changed: {
    operation: 'set' | 'delete'
    goal_type?: 'incomePercent' | 'monthly' | 'monthlySpend' | 'targetBalance'
  }
  budget_quick_amount_selected: { preset_position: number }
  data_export_requested: { format: 'csv' | 'json' }
  envelope_color_changed: Record<string, never>
  external_link_opened: {
    destination: 'taxes_calculator' | 'taxes_video' | 'taxes_settings'
  }
  legacy_budgets_converted: Record<string, never>
  local_data_reload_requested: Record<string, never>
  logout: { source: 'settings_menu' }
  setting_changed: {
    setting:
      | 'auto_sync'
      | 'display_currency'
      | 'emoji_icons'
      | 'language'
      | 'prefer_zenmoney_budgets'
      | 'theme'
    value: boolean | 'changed' | 'set'
  }
  similar_transactions_selected: Record<string, never>
  sync_completed: { mode: 'first' | 'update' }
  transaction_deleted: {
    mode: 'bulk' | 'single'
    source: 'bulk_toolbar' | 'context_menu' | 'preview'
  }
  transaction_deleted_permanently: { source: 'preview' }
  transaction_details_viewed: { source: 'transactions_page' }
  transaction_edited: { source: 'preview' }
  transaction_recreated: { source: 'preview' }
  transaction_restored: { source: 'context_menu' | 'preview' }
  transaction_tags_changed: {
    mode: 'bulk'
    source: 'bulk_modal' | 'bulk_toolbar'
  }
  transaction_viewed_changed: {
    mode: 'bulk' | 'single'
    source: 'bulk_toolbar' | 'context_menu' | 'transaction_list'
    viewed: boolean
  }
  transactions_combined: {
    result_type: 'income' | 'outcome' | 'transfer'
    source: 'bulk_toolbar'
  }
  transactions_older_marked_viewed: Record<string, never>
}

export type AnalyticsEventName = keyof AnalyticsEventMap
export type AnalyticsProperties = AnalyticsEventMap[AnalyticsEventName]
