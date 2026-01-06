#[cfg(windows)]
fn main() {
    // definição da logo executável com o winres:
    let mut res = winres::WindowsResource::new();

    res.set_icon("../assets/voxygen/logo.ico");
    res.compile().expect("falha ao construir a logo executável.");
}

#[cfg(not(windows))]
fn main() {}