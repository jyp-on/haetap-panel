use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

use crate::ipc::AppState;

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

    let _ = TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "quit" => {
                let app_handle = app.clone();
                let manager = app_handle.state::<AppState>().manager.clone();
                tauri::async_runtime::spawn(async move {
                    let pids = manager.running_pids().await;
                    for (_id, pid) in pids.iter() {
                        unsafe {
                            libc::kill(*pid as i32, libc::SIGTERM);
                        }
                    }
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    let still = manager.running_pids().await;
                    for (_id, pid) in still.iter() {
                        unsafe {
                            libc::kill(*pid as i32, libc::SIGKILL);
                        }
                    }
                    app_handle.exit(0);
                });
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}
