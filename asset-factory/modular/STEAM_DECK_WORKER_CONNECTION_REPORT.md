# Steam Deck Worker Connection Preflight

Status: **STEAM_DECK_WORKER_READY**

The existing Steam Deck worker was reached automatically at `deck@10.0.0.4`. SSH key authentication and the previously trusted host identity passed. The worker reports node name `steamdeck`, Linux/SteamOS, and x86_64 architecture.

Blender 5.2.0 LTS was found through `flatpak run org.blender.Blender`. The required background Python health check printed `GROWGO_WORKER_PYTHON_OK` and exited cleanly.

A disposable text payload completed an SSH/SFTP round trip with matching local, remote, and returned SHA-256 checksums. The temporary connection-test directory was removed. No Blender asset or production job was started.
