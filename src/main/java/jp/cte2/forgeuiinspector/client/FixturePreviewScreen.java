package jp.cte2.forgeuiinspector.client;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;

/**
 * Common local-only shell for the larger CTE2 screen previews.  It deliberately
 * owns no menu, level, capability, or network state: its only job is to make
 * geometry and real Minecraft text/ItemStack rendering reproducible.
 */
abstract class FixturePreviewScreen extends Screen {
    protected final Screen parent;
    protected int fixtureIndex;
    protected float scale = 1;
    protected int originX;
    protected int originY;

    protected FixturePreviewScreen(Screen parent, Component title) {
        super(title);
        this.parent = parent;
        this.fixtureIndex = PreviewLaunchOptions.fixtureIndex();
    }

    protected abstract int logicalWidth();
    protected abstract int logicalHeight();
    protected abstract void drawContent(GuiGraphics graphics);
    protected int titleClipWidth() { return 200; }

    @Override
    protected void init() {
        scale = Math.min(1, Math.min(width / (float) logicalWidth(), height / (float) logicalHeight()));
        originX = Math.round((width - logicalWidth() * scale) / 2);
        originY = Math.round((height - logicalHeight() * scale) / 2);
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        renderBackground(graphics);
        graphics.pose().pushPose();
        graphics.pose().translate(originX, originY, 0);
        graphics.pose().scale(scale, scale, 1);
        graphics.fill(0, 0, logicalWidth(), logicalHeight(), 0xff20242b);
        graphics.fill(1, 1, logicalWidth() - 1, 22, 0xff151e28);
        graphics.fill(1, 21, logicalWidth() - 1, 22, 0xff38536a);
        graphics.drawString(font, font.substrByWidth(title, titleClipWidth()).getString(), 8, 7, 0xffe7edf3, false);
        Component fixture = Component.translatable("screen.forgeuiinspector.fixture", fixtureName());
        graphics.drawString(font, font.substrByWidth(fixture, Math.min(190, logicalWidth() - 120)).getString(), logicalWidth() - Math.min(200, logicalWidth() - 20), 7, 0xffaac3d8, false);
        drawContent(graphics);
        graphics.pose().popPose();
        super.render(graphics, mouseX, mouseY, partialTick);
    }

    protected Component fixtureName() {
        return Component.translatable(switch (fixtureIndex) {
            case 1 -> "screen.forgeuiinspector.empty";
            case 2 -> "screen.forgeuiinspector.many";
            case 3 -> "screen.forgeuiinspector.other";
            default -> "screen.forgeuiinspector.normal";
        });
    }

    protected int fixtureItemCount(int normal, int many, int other) {
        return switch (fixtureIndex) {
            case 1 -> 0;
            case 2 -> many;
            case 3 -> other;
            default -> normal;
        };
    }

    protected void panel(GuiGraphics graphics, int x, int y, int width, int height) {
        graphics.fill(x, y, x + width, y + height, 0xff151e28);
        graphics.fill(x, y, x + width, y + 1, 0xff38536a);
        graphics.fill(x, y + height - 1, x + width, y + height, 0xff38536a);
        graphics.fill(x, y, x + 1, y + height, 0xff38536a);
        graphics.fill(x + width - 1, y, x + width, y + height, 0xff38536a);
    }

    protected void slot(GuiGraphics graphics, int x, int y, ItemStack stack) {
        graphics.fill(x, y, x + 18, y + 18, 0xff8b8b8b);
        graphics.fill(x + 1, y + 1, x + 17, y + 17, 0xff373737);
        if (!stack.isEmpty()) {
            graphics.renderItem(stack, x + 1, y + 1);
            graphics.renderItemDecorations(font, stack, x + 1, y + 1);
        }
    }

    protected void itemGrid(GuiGraphics graphics, int x, int y, int columns, int rows, int count, ItemStack item) {
        for (int index = 0; index < columns * rows; index++) {
            slot(graphics, x + (index % columns) * 18, y + (index / columns) * 18, index < count ? item : ItemStack.EMPTY);
        }
    }

    protected String clipped(String value, int width) {
        return font.substrByWidth(Component.literal(value), width).getString();
    }

    protected double localX(double x) { return (x - originX) / scale; }
    protected double localY(double y) { return (y - originY) / scale; }

    protected void cycleFixture(int step) {
        fixtureIndex = (fixtureIndex + step + 4) % 4;
    }

    @Override
    public boolean keyPressed(int keyCode, int scanCode, int modifiers) {
        if (keyCode == 256) {
            onClose();
            return true;
        }
        if (keyCode == 262) {
            cycleFixture(1);
            return true;
        }
        if (keyCode == 263) {
            cycleFixture(-1);
            return true;
        }
        return super.keyPressed(keyCode, scanCode, modifiers);
    }

    @Override
    public boolean mouseClicked(double mouseX, double mouseY, int button) {
        if (localX(mouseX) >= logicalWidth() - 205 && localY(mouseY) <= 24) {
            cycleFixture(1);
            return true;
        }
        return super.mouseClicked(mouseX, mouseY, button);
    }

    @Override
    public void onClose() {
        Minecraft.getInstance().setScreen(parent);
    }
}
