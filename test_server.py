import unittest

import server


class SearchParserTests(unittest.TestCase):
    def test_extracts_multiple_results_and_nested_text(self):
        parser = server.SearchResultParser()
        parser.feed(
            '<div class="result"><a class="result__a" href="https://example.com/a">'
            'First <b>game</b></a><a class="result__snippet">A <b>public</b> source</a></div>'
            '<div class="result"><a class="result__a" href="https://example.com/b">'
            'Second</a><a class="result__snippet">Another source</a></div>'
        )
        self.assertEqual(len(parser.results), 2)
        self.assertEqual(parser.results[0]["title"], "First game")
        self.assertEqual(parser.results[0]["snippet"], "A public source")
        self.assertEqual(parser.results[1]["url"], "https://example.com/b")

    def test_rejects_non_https_and_local_urls_before_network_access(self):
        with self.assertRaises(server.ResearchError):
            server.require_public_https_url("http://example.com")
        with self.assertRaises(server.ResearchError):
            server.require_public_https_url("https://localhost/private")

    def test_game_design_requires_concrete_project_fields(self):
        design = {
            "title": "Cidade das sementes",
            "pitch": "Um jogo autoral.",
            "setting": "Uma cidade costeira.",
            "core_loop": "Explorar, negociar e construir.",
            "mechanics": ["Explorar bairros", "Cultivar espaços", "Negociar recursos"],
            "first_mission": "Recupere uma praça comunitária.",
            "prototype_scope": ["Uma praça", "Três recursos"],
            "originality_notes": "Personagens e cenário próprios.",
            "game_html": "<!doctype html><html><body><button>Jogar</button></body></html>",
        }
        self.assertEqual(server.validate_game_design(design)["title"], "Cidade das sementes")
        with self.assertRaises(server.ResearchError):
            server.validate_game_design({**design, "mechanics": []})
        with self.assertRaises(server.ResearchError):
            server.validate_game_design({**design, "game_html": "<html><script src='https://example.com/game.js'></script></html>"})

    def test_topic_split_is_bounded(self):
        self.assertEqual(server.split_topics("GTA 1 + Minecraft + outro"), ["GTA 1", "Minecraft"])

    def test_public_job_sources_never_include_downloaded_page_text(self):
        source = {
            "reference": "Example game",
            "title": "Public page",
            "url": "https://example.com",
            "domain": "example.com",
            "excerpt": "Visible excerpt",
            "readStatus": "Page read",
            "_content": "Long source contents are kept server-side only.",
        }
        self.assertNotIn("_content", server.public_source(source))


if __name__ == "__main__":
    unittest.main()
