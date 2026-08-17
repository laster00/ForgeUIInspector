package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

/** Server-free, read-only fixture preview of the Master Stash screen. */
public final class MasterStashPreviewScreen extends FixturePreviewScreen {
    private static final int W = 650, H = 350;
    private static final int RAIL_X = 91, RAIL_Y = 34, RAIL_W = 92, RAIL_ROW_H = 33;
    private static final int PAGE_ONE_X = 191, PAGE_TWO_X = 375, STASH_Y = 52;
    private static final int INVENTORY_X = 191, INVENTORY_Y = 230, HOTBAR_Y = 288;
    public MasterStashPreviewScreen(Screen parent) { super(parent, Component.translatable("screen.forgeuiinspector.master.title")); }
    @Override protected int logicalWidth() { return W; }
    @Override protected int logicalHeight() { return H; }
    @Override protected int titleClipWidth() { return 260; }

    @Override
    protected void drawContent(GuiGraphics g) {
        // One compact category rail and two 9x9 pages.  The preview mirrors the
        // approved in-game geometry; it intentionally has no search, detail or
        // action controls.
        panel(g, RAIL_X, RAIL_Y, RAIL_W, RAIL_ROW_H * 5 + 2);
        String[] railKeys = {
            "screen.forgeuiinspector.master.category.gear",
            "screen.forgeuiinspector.master.category.maps",
            "screen.forgeuiinspector.master.category.currency",
            "screen.forgeuiinspector.master.category.gems",
            "screen.forgeuiinspector.master.category.profession"
        };
        for (int i = 0; i < railKeys.length; i++) {
            int y = RAIL_Y + 1 + i * RAIL_ROW_H;
            boolean selected = i == 0;
            if (selected) g.fill(RAIL_X + 1, y, RAIL_X + RAIL_W - 1, y + RAIL_ROW_H, 0xff38536a);
            String label = Component.translatable(railKeys[i]).getString();
            String count = Integer.toString(railCount(i));
            g.drawString(font, clipped(label, 63), RAIL_X + 7, y + 6, selected ? 0xfff0b45b : 0xffe7edf3, false);
            g.drawString(font, count, RAIL_X + RAIL_W - 7 - font.width(count), y + 6, 0xffaac3d8, false);
        }

        panel(g, PAGE_ONE_X - 1, STASH_Y - 1, 164, 164);
        panel(g, PAGE_TWO_X - 1, STASH_Y - 1, 164, 164);
        int count = fixtureItemCount(23, 140, 4);
        for (int index = 0; index < 81; index++) {
            slot(g, PAGE_ONE_X + (index % 9) * 18, STASH_Y + (index / 9) * 18, index < count ? previewItem(index) : ItemStack.EMPTY);
            slot(g, PAGE_TWO_X + (index % 9) * 18, STASH_Y + (index / 9) * 18, index + 81 < count ? previewItem(index + 81) : ItemStack.EMPTY);
        }

        g.drawString(font, Component.translatable("screen.forgeuiinspector.inventory"), INVENTORY_X, INVENTORY_Y - 12, 0xffaac3d8, false);
        itemGrid(g, INVENTORY_X, INVENTORY_Y, 9, 3, 0, ItemStack.EMPTY);
        itemGrid(g, INVENTORY_X, HOTBAR_Y, 9, 1, 4, new ItemStack(Items.BREAD));

        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.status"), PAGE_TWO_X, INVENTORY_Y, 0xff78d39a, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.page"), PAGE_TWO_X, INVENTORY_Y + 18, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.readonly"), PAGE_TWO_X, INVENTORY_Y + 36, 0xfff0b45b, false);
    }

    private int railCount(int railIndex) {
        int total = fixtureItemCount(23, 140, 4);
        return switch (railIndex) {
            case 1 -> Math.max(0, total / 3);
            case 2 -> Math.max(0, total / 4);
            case 3 -> Math.max(0, total / 5);
            case 4 -> fixtureIndex == 3 ? total : Math.max(0, total / 9);
            default -> total;
        };
    }

    private ItemStack previewItem(int index) {
        return new ItemStack(index % 4 == 0 ? Items.MAP : index % 4 == 1 ? Items.PAPER : index % 4 == 2 ? Items.COMPASS : Items.CHEST, (index % 12) + 1);
    }
}
