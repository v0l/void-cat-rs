use rocket::http::Status;
use rocket::request::{FromRequest, Outcome};
use rocket::{async_trait, Request};

use base64::prelude::*;
use nostr::{Event, JsonUtil, Kind, Tag, TagKind, Timestamp};

pub struct BlossomAuth {
    pub pubkey: String,
    pub event: Event,
}

#[async_trait]
impl<'r> FromRequest<'r> for BlossomAuth {
    type Error = &'static str;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        return if let Some(auth) = request.headers().get_one("authorization") {
            if auth.starts_with("Nostr ") {
                let event = if let Ok(j) = BASE64_STANDARD.decode(auth[6..].to_string()) {
                    if let Ok(ev) = Event::from_json(j) {
                        ev
                    } else {
                        return Outcome::Error((Status::new(403), "Invalid nostr event"));
                    }
                } else {
                    return Outcome::Error((Status::new(403), "Invalid auth string"));
                };

                if event.kind != Kind::Custom(24242) {
                    return Outcome::Error((Status::new(401), "Wrong event kind"));
                }
                if event.created_at > Timestamp::now() {
                    return Outcome::Error((
                        Status::new(401),
                        "Created timestamp is in the future",
                    ));
                }

                // check expiration tag
                if let Some(expiration) = event.tags.iter().find_map(|t| match t {
                    Tag::Expiration(v) => Some(v),
                    _ => None,
                }) {
                    if *expiration <= Timestamp::now() {
                        return Outcome::Error((Status::new(401), "Expiration invalid"));
                    }
                } else {
                    return Outcome::Error((Status::new(401), "Missing expiration tag"));
                }

                if let Err(_) = event.verify() {
                    return Outcome::Error((Status::new(401), "Event signature invalid"));
                }
                Outcome::Success(BlossomAuth {
                    pubkey: event.pubkey.to_string(),
                    event,
                })
            } else {
                Outcome::Error((Status::new(403), "Auth scheme must be Nostr"))
            }
        } else {
            Outcome::Error((Status::new(403), "Auth header not found"))
        };
    }
}