pub struct Db(pub std::sync::Mutex<rusqlite::Connection>);
