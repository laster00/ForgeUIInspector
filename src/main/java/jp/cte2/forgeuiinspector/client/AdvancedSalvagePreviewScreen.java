package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

/** Server-free, read-only fixture preview of the Advanced Salvage screen. */
public final class AdvancedSalvagePreviewScreen extends FixturePreviewScreen {
    private static final int W = 960, H = 540;
    public AdvancedSalvagePreviewScreen(Screen parent) { super(parent, Component.translatable("screen.forgeuiinspector.salvage.title")); }
    @Override protected int logicalWidth() { return W; }
    @Override protected int logicalHeight() { return H; }

    @Override
    protected void drawContent(GuiGraphics g) {
        g.fill(10, 40, 950, 64, 0xff1d2936);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.workflow"), 22, 48, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.fixture"), 248, 48, 0xfff0b45b, false);
        panel(g, 10, 76, 436, 392);
        panel(g, 454, 76, 496, 392);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.catalog"), 22, 88, 0xffe7edf3, false);
        int presets = fixtureItemCount(4, 11, 2);
        for (int i = 0; i < 11; i++) {
            int y = 106 + i * 30;
            g.fill(18, y, 438, y + 27, i < presets ? (i == 0 ? 0xff38536a : 0xff1d2936) : 0xff151e28);
            if (i < presets) {
                g.drawString(font, clipped(Component.translatable("screen.forgeuiinspector.salvage.preset", i + 1).getString(), 244), 28, y + 8, 0xffe7edf3, false);
                g.drawString(font, i % 2 == 0 ? Component.translatable("screen.forgeuiinspector.salvage.keep") : Component.translatable("screen.forgeuiinspector.salvage.salvage"), 318, y + 8, i % 2 == 0 ? 0xff78d39a : 0xfff0b45b, false);
            }
        }
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.selected"), 468, 88, 0xffe7edf3, false);
        g.fill(468, 104, 936, 153, 0xff1d2936);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.selectedName"), 482, 114, 0xffe7edf3, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.ruleSummary"), 482, 133, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.held"), 468, 171, 0xffe7edf3, false);
        itemGrid(g, 468, 188, 9, 2, fixtureIndex == 1 ? 0 : 7, new ItemStack(Items.IRON_SWORD));
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.history"), 468, 238, 0xffe7edf3, false);
        for (int i = 0; i < 4; i++) {
            g.fill(468, 253 + i * 29, 936, 280 + i * 29, 0xff1d2936);
            g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.historyEntry", i + 1), 480, 261 + i * 29, 0xffaac3d8, false);
        }
        g.fill(10, 484, 950, 524, 0xff151e28);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.readonly"), 22, 494, 0xfff0b45b, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.salvage.status"), 22, 509, 0xff78d39a, false);
    }
}
