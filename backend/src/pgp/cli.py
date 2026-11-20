import logging

import click

from .operations import run_encrypt


class OperationsGroup(click.Group):
    def format_commands(self, ctx: click.Context, formatter: click.HelpFormatter) -> None:
        rows = [(name, self.get_command(ctx, name).get_short_help_str()) for name in self.list_commands(ctx)]
        if rows:
            with formatter.section("Operations"):
                formatter.write_dl(rows)
        # end if


@click.group(cls=OperationsGroup, options_metavar="[OPTIONS]", subcommand_metavar="OPERATION [ARGS]...")
def cli() -> None:
    pass


@cli.command(short_help="Encrypt extracted Yahoo news articles into the pgp_messages table")
@click.option("-p", "--passphrase", "passphrase", required=True, help="Passphrase used to encrypt the articles")
def encrypt(passphrase: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run_encrypt({"passphrase": passphrase})


if __name__ == "__main__":
    cli()
# end if
