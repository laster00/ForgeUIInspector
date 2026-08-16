package jp.cte2.forgeuiinspector.client;

import com.mojang.blaze3d.platform.InputConstants;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.TitleScreen;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RegisterKeyMappingsEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import org.lwjgl.glfw.GLFW;

@Mod.EventBusSubscriber(modid = "forgeuiinspector", value = Dist.CLIENT, bus = Mod.EventBusSubscriber.Bus.MOD)
public final class ForgeUIInspectorClient {
    private static KeyMapping openKey;
    private static KeyMapping currencyKey;
    private static boolean autoPreviewOpened;
    private ForgeUIInspectorClient() { }
    @SubscribeEvent
    public static void registerKeys(RegisterKeyMappingsEvent event) {
        openKey = new KeyMapping("key.forgeuiinspector.open", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_F8, "key.categories.misc");
        currencyKey = new KeyMapping("key.forgeuiinspector.currency", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_F7, "key.categories.misc");
        event.register(openKey);
        event.register(currencyKey);
    }
    @Mod.EventBusSubscriber(modid = "forgeuiinspector", value = Dist.CLIENT, bus = Mod.EventBusSubscriber.Bus.FORGE)
    public static final class ClientEvents {
        @SubscribeEvent
        public static void clientTick(TickEvent.ClientTickEvent event) {
            if (event.phase != TickEvent.Phase.END) return;
            Minecraft mc = Minecraft.getInstance();

            // The capture harness can request one deterministic preview without
            // creating a world. The property is only set by the dev run task.
            if (!autoPreviewOpened && mc.screen instanceof TitleScreen) {
                String requested = System.getProperty("forgeuiinspector.preview", "");
                if ("map".equals(requested)) {
                    autoPreviewOpened = true;
                    mc.setScreen(new MapStashPreviewScreen(mc.screen));
                    return;
                }
                if ("currency".equals(requested)) {
                    autoPreviewOpened = true;
                    mc.setScreen(new CurrencyStashPreviewScreen(mc.screen));
                    return;
                }
            }

            if (openKey != null && openKey.consumeClick()) {
                mc.setScreen(new MapStashPreviewScreen(mc.screen));
            }
            if (currencyKey != null && currencyKey.consumeClick()) {
                mc.setScreen(new CurrencyStashPreviewScreen(mc.screen));
            }
        }
    }
}
