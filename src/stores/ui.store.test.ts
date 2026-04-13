import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui.store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      currentPage: 'dashboard',
      theme: 'system',
      settingsTab: 'paths',
    });
  });

  it('should have correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.currentPage).toBe('dashboard');
    expect(state.theme).toBe('system');
    expect(state.settingsTab).toBe('paths');
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebarOpen', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('navigate', () => {
    it('should change currentPage', () => {
      useUIStore.getState().navigate('settings');
      expect(useUIStore.getState().currentPage).toBe('settings');
    });
  });

  describe('setTheme', () => {
    it('should update theme', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });
  });

  describe('setSettingsTab', () => {
    it('should update settingsTab', () => {
      useUIStore.getState().setSettingsTab('video');
      expect(useUIStore.getState().settingsTab).toBe('video');
    });
  });
});
