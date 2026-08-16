package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

/** Server-free, read-only fixture preview of the Profession Workshop screen. */
public final class ProfessionWorkshopPreviewScreen extends FixturePreviewScreen {
    private static final int W = 620, H = 340;
    public ProfessionWorkshopPreviewScreen(Screen parent) { super(parent, Component.translatable("screen.forgeuiinspector.profession.title")); }
    @Override protected int logicalWidth() { return W; }
    @Override protected int logicalHeight() { return H; }

    @Override
    protected void drawContent(GuiGraphics g) {
        String[] tabs = {"screen.forgeuiinspector.profession.tab.crafting", "screen.forgeuiinspector.profession.tab.gathering", "screen.forgeuiinspector.profession.tab.smelting"};
        for (int i = 0; i < tabs.length; i++) {
            int x = 8 + i * 125;
            g.fill(x, 29, x + 116, 50, i == 0 ? 0xff38536a : 0xff1d2936);
            g.drawString(font, Component.translatable(tabs[i]), x + 7, 36, i == 0 ? 0xfff0b45b : 0xffaac3d8, false);
        }
        g.fill(8, 56, 304, 76, 0xff1d2936);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.search"), 15, 63, 0xffaac3d8, false);
        g.fill(188, 56, 304, 76, 0xff263a4a);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.filter"), 198, 63, 0xffe7edf3, false);
        panel(g, 8, 84, 304, 196);
        panel(g, 320, 84, 292, 196);
        int recipes = fixtureItemCount(5, 9, 1);
        for (int i = 0; i < 9; i++) {
            int y = 91 + i * 20;
            g.fill(14, y, 306, y + 19, i < recipes ? (i == 0 ? 0xff38536a : 0xff1d2936) : 0xff151e28);
            if (i < recipes) {
                g.renderItem(new ItemStack(i % 2 == 0 ? Items.IRON_INGOT : Items.GOLD_INGOT), 20, y + 1);
                g.drawString(font, clipped(Component.translatable("screen.forgeuiinspector.profession.recipe", i + 1).getString(), 224), 42, y + 6, 0xffe7edf3, false);
                g.drawString(font, Integer.toString(12 + i), 278, y + 6, 0xffaac3d8, false);
            }
        }
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.detail"), 334, 96, 0xffe7edf3, false);
        g.renderItem(new ItemStack(Items.CRAFTING_TABLE), 342, 114);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.output"), 372, 121, 0xffaac3d8, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.materials"), 334, 153, 0xffaac3d8, false);
        itemGrid(g, 336, 169, 5, 1, fixtureIndex == 1 ? 0 : 3, new ItemStack(Items.IRON_INGOT));
        g.fill(336, 238, 602, 263, 0xff263a4a);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.craft"), 346, 246, 0xfff0b45b, false);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.readonly"), 8, 292, 0xffaac3d8, false);
        g.fill(8, 306, 612, 326, 0xff151e28);
        g.drawString(font, Component.translatable("screen.forgeuiinspector.profession.status"), 16, 312, 0xff78d39a, false);
    }
}
