package jp.cte2.forgeuiinspector.client;

/** Shared logical geometry for the CTE2 map and currency stash previews. */
public final class Cte2StashPreviewGeometry {
    public static final int WIDTH = 474, HEIGHT = 326;
    public static final int LIST_X = 12, LIST_Y = 34, LIST_WIDTH = 200, LIST_ROW_HEIGHT = 18, LIST_ROWS = 10;
    public static final int STASH_X = 240, STASH_Y = 34, STASH_COLUMNS = 12, STASH_ROWS = 8, SLOT_SIZE = 18;
    public static final int PAGE_PREVIOUS_X = 240, PAGE_NEXT_X = 298, PAGE_BUTTON_Y = 186;
    public static final int PAGE_BUTTON_WIDTH = 54, PAGE_BUTTON_HEIGHT = 20, PAGE_LABEL_X = 360, PAGE_LABEL_Y = 192;
    public static final int INVENTORY_X = 267, INVENTORY_Y = 228, INVENTORY_COLUMNS = 9, INVENTORY_ROWS = 3;
    public static final int HOTBAR_Y = 290, HOTBAR_COLUMNS = 9, HOTBAR_ROWS = 1;
    public static final int INVENTORY_LABEL_X = 267, INVENTORY_LABEL_Y = 216;
    public static final int PAGE_SIZE = STASH_COLUMNS * STASH_ROWS;

    private Cte2StashPreviewGeometry() { }
}
