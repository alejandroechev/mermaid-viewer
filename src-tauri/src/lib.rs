use std::sync::Mutex;

// Holds the initial diagram content passed via CLI arguments
pub struct InitialDiagram(pub Mutex<Option<String>>);

#[tauri::command]
fn get_initial_diagram(state: tauri::State<'_, InitialDiagram>) -> Option<String> {
    state.0.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Parse CLI arguments: accept a raw mermaid string or a .mmd file path
    let diagram_content = std::env::args().nth(1).and_then(|arg| {
        let path = std::path::Path::new(&arg);
        if path.exists() && path.is_file() {
            std::fs::read_to_string(path).ok()
        } else {
            Some(arg)
        }
    });

    tauri::Builder::default()
        .manage(InitialDiagram(Mutex::new(diagram_content)))
        .invoke_handler(tauri::generate_handler![get_initial_diagram])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
