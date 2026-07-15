use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct GitError {
    pub code: String,
    pub message: String,
}
