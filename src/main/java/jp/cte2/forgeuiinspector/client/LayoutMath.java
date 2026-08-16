package jp.cte2.forgeuiinspector.client;

/** Pure geometry helpers, kept separate so fixture/layout behavior is testable without Minecraft. */
public final class LayoutMath {
    private LayoutMath() { }
    public static int centeredLeft(int screenWidth, int panelWidth) { return Math.max(4, (screenWidth - panelWidth) / 2); }
    public static int clampScroll(int requested, int rowCount, int visibleRows) {
        return Math.max(0, Math.min(requested, Math.max(0, rowCount - visibleRows)));
    }
    public static int pageFor(int itemCount, int pageSize, int page) {
        int pages = Math.max(1, (itemCount + pageSize - 1) / pageSize);
        return Math.max(0, Math.min(page, pages - 1));
    }
}
