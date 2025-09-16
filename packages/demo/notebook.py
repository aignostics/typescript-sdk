import marimo

__generated_with = "0.14.10"
app = marimo.App(width="medium")

@app.cell(hide_code=True)
def _(mo, neighborhood_stat_dict):
    # if the notebook is in print mode, the graphs we are exporting are hard-coded
    # and no drop-down menu's will be displayed.
    print_mode = mo.cli_args().get("print") or True

    # store the kwargs for all the graphs that will be generated when in print mode
    print_mode_graph_settings = {
        "tissue": [{"statistic": "AREA"}],
        "cell": [
            {"statistic": "CELL_PERC", "tissue_type": "All tissue types"},
            {"statistic": "CELL_DENS", "tissue_type": "Carcinoma"},
            {"statistic": "CELL_DENS", "tissue_type": "Stroma"},
        ],
        "neighborhood": [
            {
                "cell_class_a": "Carcinoma cell",
                "roi": "Carcinoma",
                "statistic": statistic,
                "radius": radius,
            }
            for radius in [20, 40]
            for statistic in neighborhood_stat_dict.keys()
        ],
    }
    return print_mode, print_mode_graph_settings


@app.cell(hide_code=True)
def _():
    import marimo as mo
    import numpy as np
    import pandas as pd

    import plotly.express as px
    import plotly.graph_objects as go
    import argparse

    aignx_colors = ["#9B95EC", "#FF7EA5", "#80A4B7", "#CA856A"]
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--readouts-path",
        dest="readouts_path",
        type=str,
        required=True,
    )
    readouts_path = parser.parse_args().readouts_path
    return (
        aignx_colors,
        go,
        mo,
        np,
        pd,
        px,
        readouts_path,
    )


@app.cell(hide_code=True)
def _():
    # Definition of statistics and cell/tissue classes to be plotted

    from dataclasses import dataclass

    @dataclass
    class statistic:
        name: str
        unit: str | None

    # the display options for tissue statistic. Display name to readouts column name.
    tissue_stat_dict = {
        "AREA": statistic(name="Area", unit="μm<sup>2</sup>"),  # TODO check units!
        "REGION_COUNT": statistic(name="Region count", unit=None),
        "LARGEST_FILLED_AREA": statistic(
            name="Largest filled area", unit="μm<sup>2</sup>"
        ),
        "AVG_ECCENTRICITY": statistic("Average eccentricity", unit=None),
    }

    # the display options for cell statistics. Display name to readouts columns n ame.
    cell_stat_dict = {
        "CELL_PERC": statistic("Percentage of total number of cells", unit="%"),
        "CELL_DENS": statistic("Density of cells", unit="cells/μm<sup>2</sup>"),
        "CELL_COUNT": statistic("Cell count", unit=None),
    }

    # the display options for neighborhood statistic. Display name to readouts column name.
    neighborhood_stat_dict = {
        "RATIO": statistic("Ratio of cells", unit=None),
        "DENSITY": statistic("Density of cells", unit="cells/μm<sup>2</sup>"),
        "AVG_MIN_DISTANCE": statistic("Average minimum distance of cells", unit="μm"),
    }

    # the tissue classes to show stats for
    tissue_classes = [
        "Carcinoma",
        "Stroma",
        "Necrosis",
        "Blood",
        "Vessel",
        "Epithelial tissue",
        "Other",
    ]

    # the cell classes to show stats for
    cell_classes = [
        "Carcinoma cell",
        "Lymphocyte",
        "Macrophage",
        "Granulocyte",
        "Plasma cell",
        "Epithelial cell",
        "Endothelial cell",
        "Fibroblast",
        "Other",
    ]

    return (
        cell_classes,
        cell_stat_dict,
        neighborhood_stat_dict,
        statistic,
        tissue_classes,
        tissue_stat_dict,
    )


@app.cell(hide_code=True)
def _(pd, readouts_path):
    def load_readouts_data():
        """Load and merge readouts data from multiple CSV files. This can take a few seconds

        This function performs data integration from three sources:
        1. Atlas readouts (>6000 columns of image analysis metrics)
        2. Slide mapping (UUID to Capri ID mapping)
        3. Manifest data (pathology diagnosis and metadata)
        """
        df = pd.read_csv(readouts_path, skiprows=1)

        n_initial = len(df)

        # ensure we have a unique mapping
        assert n_initial == len(df)

        return df

    df = load_readouts_data()
    return (df,)


@app.cell(hide_code=True)
def _(aignx_colors, go, mo, print_mode, px, statistic):
    def to_allcaps(cls):
        return cls.upper().replace(" ", "_")

    # to number each plot
    plot_index = 1

    # Nice to have:
    # sample size in the plot
    # other plotting options like violin plots or scatter plots
    def plot_boxplot(
        df,
        variable: str,
        stat: statistic,
        *,
        title: str = "",
        color: str | None = None,
        subtitle: str | None = None,
    ):
        """Plot boxplot from the given dataframe.

        Args:
        ----
          df: the dataframe, containing one column of numbers for each box to plot.
          variable: the x-label; the name of the variable for which to plot boxes.
          value: the y-label; the name of the number we are plotting.
          title: a title for the plot
          color: If given, splits the data into groups. Color should match one of the
          dataframe columns, and if given, a separate series ius plotted for each unique
          value in this column.
        """
        global plot_index
        # plotly expects dataframe in long form
        df = df.melt(var_name=variable, value_name=stat.name, id_vars=color)

        y_label = stat.name.capitalize()
        if stat.unit is not None:
            y_label += f" ({stat.unit})"

        title = f"Distribution of {title}".capitalize()
        if subtitle:
            title += f"<br><sub>Data from column(s): {subtitle}</sub>"
        if print_mode:
            title = f"{plot_index}. {title}"
            plot_index += 1

        fig = px.box(
            df,
            x=variable,
            y=stat.name,
            color=color,
            color_discrete_sequence=aignx_colors,
        )
        legend_title = color.capitalize() if color is not None else None
        fig.update_layout(
            title={"text": title},
            xaxis_title={"text": variable.capitalize(), "font_size": 16},
            yaxis_title={"text": y_label, "font_size": 16},
            legend_title=legend_title,
            yaxis_tickformat=".2g",
            font_size=14,
        )
        fig.update_layout(margin_t=120)

        return mo.ui.plotly(fig)

    return plot_boxplot, to_allcaps


@app.cell(hide_code=True)
def _(mo, print_mode, tissue_stat_dict):
    def dict_to_dropdown(dict, label):
        return mo.ui.dropdown(
            options={value.name: key for key, value in dict.items()},
            label=label,
            value=list(dict.values())[0].name,
        )

    tissue_stat_dropdown = dict_to_dropdown(
        tissue_stat_dict, label="Select the statistic you would like to display"
    )

    def render_tissue_ui_elements():
        text = mo.md(
            r"""
    # Tissue Segmentation

    This section shows results produced by the tissue segmentation model.

    """
        )
        if print_mode:
            return text
        else:
            return mo.vstack([text, tissue_stat_dropdown])

    render_tissue_ui_elements()
    return dict_to_dropdown, tissue_stat_dropdown


@app.cell(hide_code=True)
def _(
    df,
    mo,
    plot_boxplot,
    print_mode,
    print_mode_graph_settings,
    tissue_classes,
    tissue_stat_dict,
    tissue_stat_dropdown,
    to_allcaps,
):
    def plot_tissue_areas(statistic):
        column_format = f"{statistic}_{{}}"
        cols = {column_format.format(to_allcaps(cls)): cls for cls in tissue_classes}
        _df = df[cols.keys()].rename(columns=cols)

        stat_name = tissue_stat_dict[statistic].name
        title = f"{stat_name} of a specific tissue type per slide"
        return plot_boxplot(
            _df,
            variable="tissue type",
            stat=tissue_stat_dict[statistic],
            color=None,
            title=title,
            subtitle=column_format,
        )

    def display_tissue_graph():
        if print_mode:
            return mo.vstack(
                [
                    plot_tissue_areas(**kwargs)
                    for kwargs in print_mode_graph_settings["tissue"]
                ]
            )
        else:
            statistic = tissue_stat_dropdown.value
            return plot_tissue_areas(statistic=statistic)

    display_tissue_graph()


@app.cell(hide_code=True)
def _(cell_stat_dict, dict_to_dropdown, mo, print_mode, tissue_classes):
    tissue_all = "All tissue types"

    tissue_type_dropdown = mo.ui.dropdown(
        options=set([tissue_all] + tissue_classes).difference({"Necrosis", "Blood"}),
        label="Select tissue type",
        value=tissue_all,
    )

    cell_stat_dropdown = dict_to_dropdown(
        cell_stat_dict, label="Select statistic to display"
    )

    def render_cc_and_ts_ui_elements():
        text = mo.md("""
    # Cell Classification And Tissue Segmentation

    This sections shows results produced by the cell classification model, combined with outputs of tissue segmentation.
    """)
        if print_mode:
            print_mode_text = mo.md(
                """Figure 2 depicts the relative number of cells (in %) per cell class within all tissue types. Subsequent figures 3 and 4 depict the cell density for the different cell classes within carcinoma and stroma tissue, respectively."""
            )
            return mo.vstack([text, print_mode_text])
        else:
            dropdown_text = mo.md("""The graph can be modified using the drop-down selectors:

    * In the first drop-down, select a tissue type to filter for cells within that tissue type. Select "All tissue types" to display the cell counts for the entire slide.

    * In the second drop-down, select which data to display. One can choose to plot absolute cell counts, relative cell counts (percentages), or densities (cell counts per squared micro-meter of tissue).
    """)
            return mo.vstack(
                [text, dropdown_text, tissue_type_dropdown, cell_stat_dropdown]
            )

    render_cc_and_ts_ui_elements()
    return cell_stat_dropdown, tissue_all, tissue_type_dropdown


@app.cell(hide_code=True)
def _(
    cell_classes,
    cell_stat_dict,
    cell_stat_dropdown,
    df,
    mo,
    plot_boxplot,
    print_mode,
    print_mode_graph_settings,
    tissue_all,
    tissue_type_dropdown,
    to_allcaps,
):
    def plot_cell_stat(tissue_type: str, statistic: str):
        stat = cell_stat_dict[statistic]

        if tissue_type == tissue_all:
            column_format = f"{statistic}_{{}}"
            title = f"{stat.name} of a specific class per slide"
        else:
            column_format = f"{statistic}_{{}}_{to_allcaps(tissue_type)}"
            title = (
                f"{stat.name} of a specific class within {tissue_type} area per slide"
            )

        columns = {
            column_format.format(to_allcaps(cell_class)): cell_class
            for cell_class in cell_classes
        }

        # TODO: filter out columns that are not in the dataframe
        _df = df[columns.keys()].rename(columns=columns)

        return plot_boxplot(
            df=_df,
            variable="cell class",
            stat=stat,
            color=None,
            title=title,
            subtitle=column_format,
        )

    def display_cell_graphs():
        if print_mode:
            return mo.vstack(
                [
                    plot_cell_stat(**kwargs)
                    for kwargs in print_mode_graph_settings["cell"]
                ]
            )
        else:
            tissue = tissue_type_dropdown.value
            statistic = cell_stat_dropdown.value
            return plot_cell_stat(tissue, statistic)

    display_cell_graphs()


@app.cell(hide_code=True)
def _(
    cell_classes,
    dict_to_dropdown,
    mo,
    neighborhood_stat_dict,
    print_mode,
    tissue_classes,
):
    cell_class_a_dropdown = mo.ui.dropdown(
        options=cell_classes, label="Select cell class", value=cell_classes[0]
    )

    roi_dropdown = mo.ui.dropdown(
        options=set(tissue_classes).difference({"Necrosis", "Blood"}),
        label="Select tissue type",
        value="Carcinoma",
    )

    nb_stat_dropdown = dict_to_dropdown(
        neighborhood_stat_dict, label="Select statistic to display"
    )

    radius_dropdown = mo.ui.dropdown(
        options=[20, 40], label="Select compute radius", value=20
    )

    def render_ui_elements():
        text = mo.md("""
            # Neighborhood Analysis

            This section shows results of a neighborhood analysis of the different cell classes. 
            For every cell, a neighborhood statistic is computed by counting the number of cells per cell class withing a specific neighborhood radius around the given reference cell. Neighborhood statistics can then be grouped by reference cell class and further filtered by tissue type. 
            """)

        if print_mode:
            print_mode_text = """In the following, neighborhood stats are analyzed for carcinoma cells within carcinoma tissue to assess carcinoma infiltration by other cells. Figures 5-10 show the ratio, the density and the average minimum distance of the other cell classes, respectively, for a radius of 20 μm (Figures 5-7) and 40 μm (Figures 8-10).
            """
            return mo.vstack([text, print_mode_text])

        else:
            text_dropdowns = """
            Select the type of statistics, and cell class A from the drop-downs. The statistic will then be plotted computed between the selected cell class and all other cell classes. If a tissue type is selected, the neighborhood statistics are only computed for cells within that tissue type.
            """

            return mo.vstack(
                [
                    text,
                    text_dropdowns,
                    cell_class_a_dropdown,
                    roi_dropdown,
                    nb_stat_dropdown,
                    radius_dropdown,
                ]
            )

    render_ui_elements()
    return (
        cell_class_a_dropdown,
        nb_stat_dropdown,
        radius_dropdown,
        roi_dropdown,
    )


@app.cell(hide_code=True)
def _(
    cell_class_a_dropdown,
    cell_classes,
    df,
    mo,
    nb_stat_dropdown,
    neighborhood_stat_dict,
    plot_boxplot,
    print_mode,
    print_mode_graph_settings,
    radius_dropdown,
    roi_dropdown,
    to_allcaps,
):
    def plot_neighborhood_stat(
        cell_class_a: str, roi: str, statistic: str, radius: int
    ):
        stat = neighborhood_stat_dict[statistic]

        column = to_allcaps(
            f"{statistic}_OF_{{}}S_AROUND_{cell_class_a}_IN_{roi}_{radius}"
        )

        # build dictionary mapping column headers to labels containing the cell class name
        columns_to_labels = {
            to_allcaps(column.format(cell_class_b)): cell_class_b
            for cell_class_b in cell_classes
        }

        _df = df[columns_to_labels.keys()].rename(columns=columns_to_labels)

        title = f"{stat.name} of a specific class in a {radius} μm radius of<br>{cell_class_a}s within {roi} area per slide"

        return plot_boxplot(
            df=_df,
            variable="cell class",
            stat=stat,
            color=None,
            title=title,
            subtitle=column,
        )

    def display_neighbourbood_graphs():
        if print_mode:
            return mo.vstack(
                [
                    plot_neighborhood_stat(**kwargs)
                    for kwargs in print_mode_graph_settings["neighborhood"]
                ]
            )
        else:
            cell_class_a = cell_class_a_dropdown.value
            roi = roi_dropdown.value
            statistic = nb_stat_dropdown.value
            radius = radius_dropdown.value
            return plot_neighborhood_stat(
                cell_class_a=cell_class_a, roi=roi, statistic=statistic, radius=radius
            )

    display_neighbourbood_graphs()


if __name__ == "__main__":
    app.run()
