package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

/** Server-free, read-only fixture preview of the Master Stash screen. */
public final class MasterStashPreviewScreen extends FixturePreviewScreen {
    private static final int W = 650, H = 350;
    public MasterStashPreviewScreen(Screen parent) { super(parent, Component.translatable("screen.forgeuiinspector.master.title")); }
    @Override protected int logicalWidth() { return W; }
    @Override protected int logicalHeight() { return H; }
    @Override protected int titleClipWidth() { return 92; }

    @Override
    protected void drawContent(GuiGraphics g) {
        g.fill(104, 4, 254, 22, 0xff1d2936);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.search"), 110, 10, 0xffaac3d8, false);
        String[] tabs = {"screen.forgeuiinspector.master.tab.all", "screen.forgeuiinspector.master.tab.maps", "screen.forgeuiinspector.master.tab.special"};
        for (int i = 0; i < tabs.length; i++) {
            int x = 8 + i * 104;
            g.fill(x, 28, x + 96, 49, i == 0 ? 0xff38536a : 0xff1d2936);
            g.drawString(font, Component.translatable(tabs[i]), x + 7, 35, i == 0 ? 0xfff0b45b : 0xffaac3d8, false);
        }
        panel(g, 8, 52, 350, 164);
        panel(g, 368, 52, 274, 164);
        int count = fixtureItemCount(23, 96, 4);
        itemGrid(g, 16, 60, 9, 9, Math.min(81, count), new ItemStack(Items.CHEST));
        itemGrid(g, 196, 60, 9, 9, Math.max(0, count - 81), new ItemStack(Items.PAPER));
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.detail"), 380, 64, 0xffe7edf3, false);
        g.drawString(font, clipped(Component.translatable("screen.forgeuiinspector.master.selected").getString(), 220), 380, 84, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.status"), 380, 106, 0xff78d39a, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.page"), 380, 127, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.readonly"), 380, 164, 0xfff0b45b, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.inventory"), 8, 231, 0xffaac3d8, false);
        itemGrid(g, 8, 242, 9, 3, 0, ItemStack.EMPTY);
        itemGrid(g, 8, 299, 9, 1, 4, new ItemStack(Items.BREAD));
        g.fill(462, 302, 642, 326, 0xff1d2936);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.master.action"), 474, 310, 0xffaac3d8, false);
    }
}
